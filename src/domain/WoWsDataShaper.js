'use strict'

const _ = require('lodash')

const Constant = require('../common/Constant')

const logger = require('log4js').getLogger()

class WoWsDataShaper {
  constructor () {
    this.players = null
    this.allShips = null
  }

  /**
   * 実際に表示するデータを生成する
   *
   * @returns {Array} プレイヤーデータ
   */
  shape () {
    const friends = []
    const enemies = []

    for (const [playerName, playerData] of Object.entries(this.players)) {
      try {
        const isPrivate = _.get(playerData, 'personal_data.hidden_profile', false)

        const personalStats = makePersonalStats(playerName, playerData, isPrivate, this.allShips)

        const shipId = playerData.ship_id
        const shipStat = makeShipStats(shipId, playerData, isPrivate, this.allShips)

        const shipInfo = makeShipInfo(shipId, this.allShips)

        const allStat = {
          player_stat: personalStats,
          ship_stat: shipStat,
          ship_info: shipInfo
        }

        const relation = _.get(playerData, 'relation', null)
        if (relation === 0 || relation === 1) {
          friends.push(allStat)
        } else if (relation === 2) {
          enemies.push(allStat)
        } else {
          logger.error(`Invalid relation. player_name: ${playerName} relation: ${relation}`)
        }
      } catch (error) {
        logger.error(`Failed to make data for displaying in browser. player_name: ${playerName}, error: ${error}`)
        continue
      }
    }

    const outputData = {}
    let sortedFriends = friends.sort(sort())
    sortedFriends = convertToRomanNumber(sortedFriends)
    sortedFriends.push(calculateTeamAverage(sortedFriends))

    let sortedEnemies = enemies.sort(sort())
    sortedEnemies = convertToRomanNumber(sortedEnemies)
    sortedEnemies.push(calculateTeamAverage(sortedEnemies))

    outputData.friends = sortedFriends
    outputData.enemies = sortedEnemies

    return outputData
  }
}

/**
 * 個人データを生成する
 *
 * @param {String} playerName
 * @param {Array} playerData
 */
const makePersonalStats = (playerName, playerData, isPrivate, allShips) => {
  const baseInfo = {
    name: playerName,
    wows_numbers: null,
    is_myself: false,
    clan_tag: null
  }

  if (playerData.account_id) {
    baseInfo.wows_numbers = `https://${process.env.REGION}.${Constant.URL.WOWS_NUMBERS}${playerData.account_id},${playerName}`
  }

  if (playerData.relation === 0) {
    baseInfo.is_myself = true
  }

  const clanTag = _.get(playerData, 'clan.tag', null)
  if (clanTag) {
    baseInfo.clan_tag = `[${clanTag}]`
  }

  if (isPrivate) {
    return Object.assign(
      baseInfo,
      {
        battles: '?',
        win_rate: '?',
        average_damage: '?',
        kill_death_rate: '?',
        average_tier: '?'
      }
    )
  }

  const personalStats = _.get(playerData, 'personal_data.statistics.pvp', null)

  if (!personalStats || _.get(personalStats, 'battles', 0) === 0) {
    return Object.assign(
      baseInfo,
      {
        battles: 0,
        win_rate: '-',
        average_damage: '-',
        kill_death_rate: '-',
        average_tier: '-'
      }
    )
  }

  return Object.assign(
    baseInfo,
    {
      battles: personalStats.battles,
      win_rate: (personalStats.wins / personalStats.battles * 100).toFixed(1),
      average_damage: (personalStats.damage_dealt / personalStats.battles).toFixed(0),
      kill_death_rate: (personalStats.frags / (personalStats.battles - personalStats.survived_battles)).toFixed(1),
      average_tier: calculateAverageTier(playerData.ship_statistics, allShips).toFixed(1)
    }
  )
}

/**
 * 艦別成績を生成する
 *
 * @param {String} shipID
 * @param {Array} player
 */
const makeShipStats = (shipID, player, isPrivate, allShips) => {
  const shipStats = pickShipStatisticsById(player.ship_statistics, shipID)
  const shipInfo = _.get(allShips, shipID, null)

  if (isPrivate) {
    return {
      cp: '?',
      battles: '?',
      win_rate: '?',
      average_damage: '?',
      kill_death_rate: '?'
    }
  }

  if (!shipStats || _.get(shipStats, 'battles', 0) === 0 || !shipInfo) {
    return {
      cp: '-',
      battles: 0,
      win_rate: '-',
      average_damage: '-',
      kill_death_rate: '-'
    }
  }

  return {
    cp: calculateCombatPower(shipStats, shipInfo),
    battles: shipStats.battles,
    win_rate: (shipStats.wins / shipStats.battles * 100).toFixed(1),
    average_damage: (shipStats.damage_dealt / shipStats.battles).toFixed(0),
    kill_death_rate: (shipStats.frags / (shipStats.battles - shipStats.survived_battles)).toFixed(1)
  }
}

/**
 * 艦情報を生成する
 *
 * @param {String} shipId
 */
const makeShipInfo = (shipId, allShips) => {
  const shipInfo = {
    name: _.get(allShips, `${shipId}.name`, null),
    type: _.get(allShips, `${shipId}.type`, null),
    tier: _.get(allShips, `${shipId}.tier`, null),
    nation: _.get(allShips, `${shipId}.nation`, null),
    detect_distance_by_ship: calculateConcealment(shipId, allShips)
  }

  return shipInfo
}

/**
 * 隠蔽距離を計算する
 *
 * @param {String} shipId
 * @returns {Number} 隠蔽距離
 */
const calculateConcealment = (shipId, allShips) => {
  const ship = _.get(allShips, shipId, null)
  if (!ship) {
    return 0
  }

  const detectDistance = _.get(ship, 'default_profile.concealment.detect_distance_by_ship', null)
  if (!detectDistance) {
    return 0
  }

  const camouflageCoefficient = 1.00 - 0.03

  let moduleCoefficient = 1.00
  if (ship.name === 'Gearing') {
    moduleCoefficient -= 0.15
  } else if (ship.tier > 7) {
    moduleCoefficient -= 0.10
  }

  let commanderCoefficient = 1.00
  switch (ship.type) {
    case 'AirCarrier':
      commanderCoefficient -= 0.16
      break
    case 'Battleship':
      commanderCoefficient -= 0.14
      break
    case 'Cruiser':
      commanderCoefficient -= 0.12
      break
    case 'Destroyer':
      commanderCoefficient -= 0.10
      break
    default:
      break
  }

  return (detectDistance * camouflageCoefficient * moduleCoefficient * commanderCoefficient).toFixed(2)
}

/**
 * 平均Tierを計算する
 *
 * @param {Array} shipStats
 * @returns {Number} 平均Tier
 */
const calculateAverageTier = (shipStats, allShips) => {
  let battlesSum = 0
  let tierSum = 0

  for (const stat of shipStats) {
    const shipBattles = _.get(stat, 'pvp.battles', 0)
    const shipTier = _.get(allShips, `[${stat.ship_id}].tier`, 0)

    if (shipBattles && shipTier) {
      battlesSum += shipBattles
      tierSum += shipBattles * shipTier
    }
  }

  return tierSum / battlesSum
}

/**
 * shipIDから鑑別成績を取得する
 *
 * @param {Array} shipStatistics
 * @param {String} shipID
 */
const pickShipStatisticsById = (shipStatistics, shipID) => {
  if (shipStatistics === null) {
    return null
  }

  for (const stat of shipStatistics) {
    if (shipID === stat.ship_id) {
      return stat.pvp
    }
  }

  return null
}

/**
 * 戦闘力を計算する
 *
 * @param {Array} pvp
 * @param {Array} info
 */
const calculateCombatPower = (pvp, info) => {
  const kill = pvp.frags
  const death = pvp.battles - pvp.survived_battles
  const averageDamage = pvp.damage_dealt / pvp.battles
  const averageExperience = pvp.xp / pvp.battles

  if (death === 0 && kill > 0) {
    return '-'
  }

  if (death === 0 && kill === 0) {
    return '-'
  }

  const kdRatio = kill / death
  if (kdRatio === 0) {
    return '-'
  }

  let typeCoefficient = 1.0
  if (info.type === 'Battleship') {
    typeCoefficient = 0.7
  } else if (info.type === 'AirCarrier') {
    typeCoefficient = 0.5
  }

  return (averageDamage * kdRatio * averageExperience / 800 * (1 - (0.03 * info.tier)) * typeCoefficient).toFixed(0)
}

/**
 * アラビア数字からローマ数字に変換する
 *
 * @param {Arrau} team
 */
const convertToRomanNumber = (team) => {
  const TIER_ROMAN = {
    1: 'Ⅰ',
    2: 'Ⅱ',
    3: 'Ⅲ',
    4: 'Ⅳ',
    5: 'Ⅴ',
    6: 'Ⅵ',
    7: 'Ⅶ',
    8: 'Ⅷ',
    9: 'Ⅸ',
    10: 'Ⅹ'
  }

  for (const player of team) {
    const number = player.ship_info.tier
    if (number >= 1 && number <= 10 && Number.isInteger(number)) {
      player.ship_info.tier = TIER_ROMAN[number]
    }
  }

  return team
}

/**
 * 平均チーム成績を計算する
 *
 * @param {Array} team
 */
const calculateTeamAverage = (team) => {
  const shipStat = {
    battles: average(team.map(x => x.ship_stat.battles)).toFixed(0),
    win_rate: average(team.map(x => x.ship_stat.win_rate)).toFixed(1),
    average_damage: average(team.map(x => x.ship_stat.average_damage)).toFixed(0),
    kill_death_rate: average(team.map(x => x.ship_stat.kill_death_rate)).toFixed(1)
  }

  const playerStat = {
    name: 'チーム平均',
    battles: average(team.map(x => x.player_stat.battles)).toFixed(0),
    win_rate: average(team.map(x => x.player_stat.win_rate)).toFixed(1),
    average_damage: average(team.map(x => x.player_stat.average_damage)).toFixed(0),
    kill_death_rate: average(team.map(x => x.player_stat.kill_death_rate)).toFixed(1),
    average_tier: average(team.map(x => x.player_stat.average_tier)).toFixed(1)
  }

  return {
    player_stat: playerStat,
    ship_stat: shipStat,
    ship_info: {}
  }
}

/**
 * 平均を計算する
 *
 * @param {Array} array
 */
const average = (array) => {
  let sum = 0
  let ignoreCount = 0
  for (const item of array) {
    if (isFinite(item)) {
      sum += Number(item)
      continue
    }
    ignoreCount += 1
  }
  const average = sum / (array.length - ignoreCount)
  return average
}

/**
 * ルールに基づいてソートするメソッドを返却する
 *
 * @param {Object}
 */
const sort = () => {
  return (a, b) => {
    // 艦種でソート
    const typeA = a.ship_info.type.toUpperCase()
    const typeB = b.ship_info.type.toUpperCase()
    if (typeA > typeB) return 1
    if (typeA < typeB) return -1

    // Tierでソート
    const tierA = parseInt(a.ship_info.tier)
    const tierB = parseInt(b.ship_info.tier)
    if (tierA < tierB) return 1
    if (tierA > tierB) return -1

    // 艦名でソート
    const shipNameA = a.ship_info.name
    const shipNameB = b.ship_info.name
    if (shipNameA > shipNameB) return 1
    if (shipNameA < shipNameB) return -1

    // プレイヤー名でソート
    const playerNameA = a.player_stat.name
    const playerNameB = b.player_stat.name
    if (playerNameA < playerNameB) return 1
    if (playerNameA > playerNameB) return -1

    return 0
  }
}

module.exports = WoWsDataShaper

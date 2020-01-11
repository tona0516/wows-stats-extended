const Env = require('./Env')
const Config = require('./Constants')
const Util = require('./Util')

const _ = require('lodash')

class WoWsDataShaper {
  constructor (players, allShips) {
    this.players = players
    this.allShips = allShips
  }

  /**
   * 実際に表示するデータを生成する
   *
   * @returns {Array} プレイヤーデータ
   */
  shape () {
    let friends = []
    let enemies = []
    for (const name in this.players) {
      try {
        const player = this.players[name]

        const personalData = this._makePersonalData(name, player)

        const shipID = player.ship_id
        const shipStat = this._makeShipStatistics(shipID, player)

        const shipInfo = this._makeShipInfo(shipID)

        let allStat = {
          'player_stat': personalData,
          'ship_stat': shipStat,
          'ship_info': shipInfo
        }

        const relation = _.get(player, 'relation', null)
        if (relation === 0 || relation === 1) {
          friends.push(allStat)
        } else if (relation === 2) {
          enemies.push(allStat)
        } else {
          logger.error(`Invalid relation. player_name: ${name} relation: ${relation}`)
        }
      } catch (error) {
        logger.error(`Failed to make data for displaying in browser. player_name: ${name}, error: ${error}`)
        continue
      }
    }

    const outputData = {}
    let sortedFriends = friends.sort(this._sortByTypeAndTier())
    sortedFriends = this._convertToRomanNumber(sortedFriends)
    sortedFriends.push(this._calculateTeamAverage(sortedFriends))

    let sortedEnemies = enemies.sort(this._sortByTypeAndTier())
    sortedEnemies = this._convertToRomanNumber(sortedEnemies)
    sortedEnemies.push(this._calculateTeamAverage(sortedEnemies))

    outputData.friends = sortedFriends
    outputData.enemies = sortedEnemies

    return outputData
  }

  /**
   * 個人データを生成する
   *
   * @param {String} name
   * @param {Array} player
   */
  _makePersonalData (name, player) {
    const isPrivate = _.get(player, 'personal_data.hidden_profile', false)

    let personalData = {}
    personalData.name = name
    personalData.wows_numbers = player.account_id !== null ? 'https://' + Env.envs.region + '.' + Config.URL.WOWS_NUMBERS + player.account_id + ',' + name : null
    personalData.is_myself = player.relation === 0
    personalData.clan_tag = _.get(player, 'clan.tag', null)
    personalData.clan_tag = personalData.clan_tag !== null ? '[' + personalData.clan_tag + ']' : null

    const playerStatistics = _.get(player, 'personal_data.statistics', null)

    if (isPrivate) {
      personalData.battles = '?'
      personalData.win_rate = '?'
      personalData.average_damage = '?'
      personalData.kill_death_rate = '?'
      personalData.average_tier = '?'
      return personalData
    }

    if (playerStatistics === null || _.get(playerStatistics, 'pvp.battles', 0) === 0) {
      personalData.battles = '0'
      personalData.win_rate = '-'
      personalData.average_damage = '-'
      personalData.kill_death_rate = '-'
      personalData.average_tier = '-'
      return personalData
    }

    let pvp = playerStatistics.pvp
    personalData.battles = pvp.battles
    personalData.win_rate = (pvp.wins / pvp.battles * 100).toFixed(1)
    personalData.average_damage = (pvp.damage_dealt / pvp.battles).toFixed(0)
    personalData.kill_death_rate = (pvp.frags / (pvp.battles - pvp.survived_battles)).toFixed(1)
    personalData.average_tier = this._calculateAverageTier(player.ship_statistics).toFixed(1)
    return personalData
  }

  /**
   * 艦別成績を生成する
   *
   * @param {String} shipID
   * @param {Array} player
   */
  _makeShipStatistics (shipID, player) {
    const theShipStatistics = this._pickShipStatisticsById(player.ship_statistics, shipID)
    const theShipInfo = _.get(this.allShips, shipID, null)
    const isPrivate = _.get(player, 'personal_data.hidden_profile', false)

    if (isPrivate) {
      return {
        'cp': '?',
        'battles': '?',
        'win_rate': '?',
        'average_damage': '?',
        'kill_death_rate': '?'
      }
    }

    if (theShipStatistics === null || theShipInfo === null || _.get(theShipStatistics, 'pvp.battles', 0) === 0) {
      return {
        'cp': '-',
        'battles': '0',
        'win_rate': '-',
        'average_damage': '-',
        'kill_death_rate': '-'
      }
    }

    let pvp = theShipStatistics.pvp
    return {
      'cp': this._calculateCombatPower(pvp, theShipInfo),
      'battles': pvp.battles,
      'win_rate': (pvp.wins / pvp.battles * 100).toFixed(1),
      'average_damage': (pvp.damage_dealt / pvp.battles).toFixed(0),
      'kill_death_rate': (pvp.frags / (pvp.battles - pvp.survived_battles)).toFixed(1)
    }
  }

  /**
   * 艦情報を生成する
   *
   * @param {String} shipID
   */
  _makeShipInfo (shipID) {
    let shipInfo = {
      'name': this.allShips[shipID].name,
      'type': this.allShips[shipID].type,
      'tier': this.allShips[shipID].tier,
      'nation': this.allShips[shipID].nation,
      'detect_distance_by_ship': this._calculateConcealment(shipID, this.allShips)
    }

    const raderRange = this._calculateRaderDetectionRange(shipInfo)
    shipInfo.rader_range = raderRange !== 0 ? raderRange : '-'

    return shipInfo
  }

  /**
   * 隠蔽距離を計算する
   *
   * @param {String} shipID
   * @returns {Number} 隠蔽距離
   */
  _calculateConcealment (shipID) {
    const detectDistance = this.allShips[shipID].default_profile.concealment.detect_distance_by_ship
    const camouflageCoefficient = 1.00 - 0.03
    let moduleCoefficient = 1.00
    if (this.allShips[shipID].name === 'Gearing') {
      moduleCoefficient = 1.00 - 0.15
    } else if (this.allShips[shipID].tier > 7) {
      moduleCoefficient = 1.00 - 0.10
    }
    let commanderCoefficient = 1
    switch (this.allShips[shipID].type) {
      case 'AirCarrier':
        commanderCoefficient = 1.00 - 0.16
        break
      case 'Battleship':
        commanderCoefficient = 1.00 - 0.14
        break
      case 'Cruiser':
        commanderCoefficient = 1.00 - 0.12
        break
      case 'Destroyer':
        commanderCoefficient = 1.00 - 0.10
        break
      default:
        break
    }

    return (detectDistance * camouflageCoefficient * moduleCoefficient * commanderCoefficient).toFixed(2)
  }

  /**
   * レーダーの有効射程を計算する
   * http://wiki.wargaming.net/en/Ship:Surveillance_Radar_Data
   *
   * @param {Object} shipInfo
   * @returns {Number} レーダー有効射程
   */
  _calculateRaderDetectionRange (shipInfo) {
    const name = shipInfo.name
    const type = shipInfo.type
    const tier = shipInfo.tier
    const nation = shipInfo.nation

    if (name.match(/Belfast/)) {
      return 8.5
    }
    if (name.match(/Missouri/)) {
      return 9.5
    }
    if (name.match(/Black/)) {
      return 7.5
    }

    if (nation === 'usa' && type === 'Cruiser') {
      if (tier === 8) {
        return 9.0
      }

      if (tier === 9) {
        if (name.match(/Alaska|Buffalo/)) {
          return 10.0
        }

        return 9.0
      }

      if (tier === 10) {
        if (name.match(/Salem/)) {
          return 8.5
        }

        if (name.match(/Worcester/)) {
          return 9.0
        }

        return 10.0
      }
    }

    if (nation === 'pan_asia' && type === 'Destroyer') {
      if (tier >= 8) {
        return 7.5
      }
    }

    if (nation === 'uk' && type === 'Cruiser') {
      if (tier >= 8) {
        return 10.0
      }
    }

    if (nation === 'ussr' && type === 'Cruiser') {
      if (tier >= 8) {
        return 12.0
      }
    }

    return 0
  }

  /**
   * 平均Tierを計算する
   *
   * @param {Array} shipStatistics
   * @returns {Number} 平均Tier
   */
  _calculateAverageTier (shipStatistics) {
    let battlesSum = 0
    let tierSum = 0
    for (let stat of shipStatistics) {
      let shipName = _.get(this.allShips, '[' + stat.ship_id + '].name', 0)
      let shipBattles = _.get(stat, 'pvp.battles', 0)
      let shipTier = _.get(this.allShips, '[' + stat.ship_id + '].tier', 0)

      if (shipName !== 0) {
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
  _pickShipStatisticsById (shipStatistics, shipID) {
    if (shipStatistics === null) {
      return null
    }

    for (let stat of shipStatistics) {
      if (shipID === stat.ship_id) {
        return stat
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
  _calculateCombatPower (pvp, info) {
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
  _convertToRomanNumber (team) {
    for (let player of team) {
      player.ship_info.tier = Util.romanNumber(player.ship_info.tier)
    }
    return team
  }

  /**
   * 平均チーム成績を計算する
   *
   * @param {Array} team
   */
  _calculateTeamAverage (team) {
    let shipStat = {
      'battles': this._average(team.map(x => x.ship_stat.battles)).toFixed(0),
      'win_rate': this._average(team.map(x => x.ship_stat.win_rate)).toFixed(1),
      'average_damage': this._average(team.map(x => x.ship_stat.average_damage)).toFixed(0),
      'kill_death_rate': this._average(team.map(x => x.ship_stat.kill_death_rate)).toFixed(1)
    }

    let playerStat = {
      'name': 'チーム平均',
      'battles': this._average(team.map(x => x.player_stat.battles)).toFixed(0),
      'win_rate': this._average(team.map(x => x.player_stat.win_rate)).toFixed(1),
      'average_damage': this._average(team.map(x => x.player_stat.average_damage)).toFixed(0),
      'kill_death_rate': this._average(team.map(x => x.player_stat.kill_death_rate)).toFixed(1),
      'average_tier': this._average(team.map(x => x.player_stat.average_tier)).toFixed(1)
    }

    return {
      'player_stat': playerStat,
      'ship_stat': shipStat,
      'ship_info': {}
    }
  }

  /**
   * 平均を計算する
   *
   * @param {Array} array
   */
  _average (array) {
    let sum = 0
    let ignoreCount = 0
    for (let item of array) {
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
  _sortByTypeAndTier () {
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
}

module.exports = WoWsDataShaper

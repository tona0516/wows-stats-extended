const Env = require('./Env')
const Config = require('./Constants')
const Util = require('./Util')

const _ = require('lodash')

class WoWsDataShaper {
  constructor (players, allShips) {
    this.players = players
    this.allShips = allShips
  }

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

        const relation = player.relation
        relation === 0 || relation === 1 ? friends.push(allStat) : enemies.push(allStat)
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

  _makePersonalData (name, player) {
    const isPrivate = _.get(player, 'personal_data.hidden_profile', false)

    let personalData = {}
    personalData.name = name
    personalData.wows_numbers = player.account_id !== null ? 'https://' + Env.region + '.' + Config.URL.WOWS_NUMBERS + player.account_id + ',' + name : null
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

    if (playerStatistics === null || _.get(playerStatistics, 'pvp.battles') === 0) {
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

    if (theShipStatistics === null || theShipInfo === null || _.get(theShipStatistics, 'pvp.battles') === 0) {
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

  _makeShipInfo (shipID) {
    return {
      'name': this.allShips[shipID].name,
      'type': this.allShips[shipID].type,
      'tier': this.allShips[shipID].tier,
      'nation': this.allShips[shipID].nation,
      'detect_distance_by_ship': this._calculateConcealment(shipID, this.allShips)
    }
  }

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

  _calculateAverageTier (shipStatistics) {
    let battlesSum = 0
    let tierSum = 0
    for (let stat of shipStatistics) {
      let shipBattles = _.get(stat, 'pvp.battles', 0)
      let shipTier = _.get(this.allShips, '[' + stat.ship_id + '].tier', 0)
      battlesSum += shipBattles
      tierSum += shipBattles * shipTier
    }
    return tierSum / battlesSum
  }

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

  _convertToRomanNumber (team) {
    for (let player of team) {
      player.ship_info.tier = Util.romanNumber(player.ship_info.tier)
    }
    return team
  }

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

  _sortByTypeAndTier () {
    return function (a, b) {
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
      const nameA = a.ship_info.name
      const nameB = b.ship_info.name
      if (nameA > nameB) return 1
      if (nameA < nameB) return -1

      return 0
    }
  }
}

module.exports = WoWsDataShaper

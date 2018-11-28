const Util = require('./Util');
const BigNumber = require('bignumber.js');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

const TIER_ROMAN = {
    1: "Ⅰ",
    2: "Ⅱ",
    3: "Ⅲ",
    4: "Ⅳ",
    5: "Ⅴ",
    6: "Ⅵ",
    7: "Ⅶ",
    8: "Ⅷ",
    9: "Ⅸ",
    10: "Ⅹ",
}

class DataPicker {
    pick(playersJson, tiersJson) {
        var friends = [];
        var enemies = [];
        for (const id in playersJson) {
            const player = playersJson[id];
            const isPrivate = player.playerstat.hidden_profile ? true : false;
    
            var shipStat = {};
            var playerStat = {};
            playerStat.name = player.info.name;
            playerStat.is_myself = player.info.relation == 0 ? true : false;
            playerStat.clan_tag = player.clan_info != null ? "[" + player.clan_info.tag + "] " : "";

            shipStat.cp = '';
            shipStat.battles = '';
            shipStat.win_rate = '';
            shipStat.average_damage = '';
            shipStat.kill_death_rate = '';

            playerStat.battles = '';
            playerStat.win_rate = '';
            playerStat.average_damage = '';
            playerStat.kill_death_rate = '';
            playerStat.average_tier = '';

            if (!isPrivate) {
                // プレイヤーが使用する艦艇の成績
                const originShipStat = findShipStatById(player.shipstat, player.info.shipId);
                const isFirstMatchByShip = originShipStat == null || originShipStat.pvp == null ? true : false;
                if (isFirstMatchByShip) {
                    shipStat.cp = '-'
                    shipStat.battles = '0';
                    shipStat.win_rate = '-';
                    shipStat.average_damage = '-';
                    shipStat.kill_death_rate = '-';
                } else {
                    shipStat.cp = calculateCombatPower(originShipStat.pvp, player.shipinfo);
                    shipStat.battles = originShipStat.pvp.battles;
                    shipStat.win_rate = (originShipStat.pvp.wins / shipStat.battles * 100).toFixed(1);
                    shipStat.average_damage = (originShipStat.pvp.damage_dealt / shipStat.battles).toFixed(0);
                    shipStat.kill_death_rate = (originShipStat.pvp.frags / (shipStat.battles - originShipStat.pvp.survived_battles)).toFixed(1);
                }
    
                 // プレイヤーに関する成績
                const originPlayerStat = player.playerstat.statistics
                const isFirstMachByPlayer = originPlayerStat == null || originPlayerStat.pvp == null ? true : false;
                if (isFirstMachByPlayer) {
                    playerStat.battles = '0';
                    playerStat.win_rate = '-';
                    playerStat.average_damage = '-';
                    playerStat.kill_death_rate = '-';
                    playerStat.average_tier = '-';
                } else {
                    playerStat.battles = originPlayerStat.pvp.battles;
                    playerStat.win_rate = (originPlayerStat.pvp.wins / playerStat.battles * 100).toFixed(1);
                    playerStat.average_damage = (originPlayerStat.pvp.damage_dealt / playerStat.battles).toFixed(0);
                    playerStat.kill_death_rate = (originPlayerStat.pvp.frags / (playerStat.battles - originPlayerStat.pvp.survived_battles)).toFixed(1);
                    playerStat.average_tier = calculateAverageTier(player.shipstat, tiersJson).toFixed(1);
                }
            } else {
                shipStat.cp = 'priv.';
                shipStat.battles = 'priv.';
                shipStat.win_rate = 'priv.';
                shipStat.average_damage = 'priv.';
                shipStat.kill_death_rate = 'priv.';
    
                playerStat.battles = 'priv.';
                playerStat.win_rate = 'priv.';
                playerStat.average_damage = 'priv.';
                playerStat.kill_death_rate = 'priv.';
                playerStat.average_tier = 'priv.';
            }
    
            // プレイヤーが使用する艦艇の情報
            var shipInfo = {};
            shipInfo.name = player.shipinfo.name;
            shipInfo.type = player.shipinfo.type;
            shipInfo.tier = player.shipinfo.tier;
            shipInfo.nation = player.shipinfo.nation;
            shipInfo.detect_distance_by_ship = player.shipinfo.default_profile.concealment.detect_distance_by_ship;
            const camouflage_coefficient = 1.00 - 0.03;
            let module_coefficient = 1.00;
            if (shipInfo.name == "Gearing") {
                module_coefficient = 1.00 - 0.15;
            } else if (shipInfo.tier > 7) {
                module_coefficient = 1.00 - 0.10;
            }
            var commander_coefficient = 1;
            switch (shipInfo.type) {
                case "AirCarrier":
                    commander_coefficient = 1.00 - 0.16;
                    break;
                case "Battleship":
                    commander_coefficient = 1.00 - 0.14;
                    break;
                case "Cruiser":
                    commander_coefficient = 1.00 - 0.12;
                    break;
                case "Destroyer":
                    commander_coefficient = 1.00 - 0.10;
                    break;
                default:
                    break;
            }
            
            shipInfo.detect_distance_by_ship = new BigNumber.BigNumber(shipInfo.detect_distance_by_ship).times(camouflage_coefficient).times(module_coefficient).times(commander_coefficient).toPrecision(3);
            
            var allStat = {};
            allStat.player_stat = playerStat;
            allStat.ship_stat = shipStat;
            allStat.ship_info = shipInfo;
    
            const relation = player.info.relation
            relation == 0 || relation == 1 ? friends.push(allStat) : enemies.push(allStat);
        }

        const outputData = {};
        var sortedFriends = friends.sort(sortByTypeAndTier());
        sortedFriends = convertToRomanNumber(sortedFriends);
        sortedFriends.push(calculateTeamAverage(sortedFriends));
        var sortedEnemies = enemies.sort(sortByTypeAndTier());
        sortedEnemies = convertToRomanNumber(sortedEnemies);
        sortedEnemies.push(calculateTeamAverage(sortedEnemies));
    
        outputData.friends = sortedFriends;
        outputData.enemies = sortedEnemies;
    
        return outputData;
    }
}

const calculateCombatPower = function(stats, info) {
    const kill = stats.frags;
    const death = stats.battles - stats.survived_battles;
    const averageDamage = stats.damage_dealt / stats.battles;
    const averageExperience = stats.xp / stats.battles;

    if (death == 0 && kill > 0) {
        return "-";
    }

    if (death == 0 && kill == 0) {
        return "-";
    }

    const kdRatio = kill / death;
    if (kdRatio == 0) {
        return "-";
    }

    let type_param = 1.0;
    if (info.type == 'Battleship') {
        type_param = 0.7;
    } else if (info.type == 'AirCarrier') {
        type_param = 0.5;
    }

    return (averageDamage * kdRatio * averageExperience / 800 * (1 - (0.03 * info.tier )) * type_param).toFixed(0);
}

const convertToRomanNumber = function(team) {
    for (var player of team) {
        player.ship_info.tier = TIER_ROMAN[player.ship_info.tier];
    }
    return team;
}

const calculateTeamAverage = function (team) {
    var shipStat = {};
    shipStat.battles = average(team.map(x => x.ship_stat.battles)).toFixed(0);
    shipStat.win_rate = average(team.map(x => x.ship_stat.win_rate)).toFixed(1);
    shipStat.average_damage = average(team.map(x => x.ship_stat.average_damage)).toFixed(0);
    shipStat.kill_death_rate = average(team.map(x => x.ship_stat.kill_death_rate)).toFixed(1);
    var playerStat = {};
    playerStat.name = "チーム平均";
    playerStat.battles = average(team.map(x => x.player_stat.battles)).toFixed(0);
    playerStat.win_rate = average(team.map(x => x.player_stat.win_rate)).toFixed(1);
    playerStat.average_damage = average(team.map(x => x.player_stat.average_damage)).toFixed(0);
    playerStat.kill_death_rate = average(team.map(x => x.player_stat.kill_death_rate)).toFixed(1);
    playerStat.average_tier = average(team.map(x => x.player_stat.average_tier)).toFixed(1);
    var shipInfo = {};
    var allStat = {};
    allStat.player_stat = playerStat;
    allStat.ship_stat = shipStat;
    allStat.ship_info = shipInfo;

    return allStat;
}

const average = function(array) {
    var sum = 0;
    var ignoreCount = 0;
    for (var item of array) {
        if (isFinite(item)) {
            sum += Number(item);
            continue;
        }
        ignoreCount += 1;
    }
    const average = sum / (array.length - ignoreCount);
    return average;
}

const findShipStatById = function (shipStats, shipId) {
    for (var shipStat of shipStats) {
        if (shipId == shipStat.ship_id) {
            return shipStat;
        }
    }
    return null;
}

const calculateAverageTier = function (shipStats, tiers) {
    var sum = 0;
    var battles = 0;
    for (var shipStat of shipStats) {
        if (shipStat.pvp.battles != null && tiers[shipStat.ship_id] != null) {
            battles += shipStat.pvp.battles;
            sum += shipStat.pvp.battles * tiers[shipStat.ship_id].tier;
        }
    }
    return sum / battles;
}

const sortByTypeAndTier = function () {
    return function (a, b) {
      var a_type = a.ship_info.type;
      var b_type = b.ship_info.type;
      a_type = a_type.toUpperCase();
      b_type = b_type.toUpperCase();
      if (a_type < b_type) return -1;
      if (a_type > b_type) return 1;
      if (a_type == b_type) {
        var a_tier = a.ship_info.tier;
        var b_tier = b.ship_info.tier;
        a_tier = parseInt(a_tier);
        b_tier = parseInt(b_tier);
        if (a_tier < b_tier) return 1;
        if (a_tier > b_tier) return -1;
      }
      return 0;
    }
}

module.exports = DataPicker;

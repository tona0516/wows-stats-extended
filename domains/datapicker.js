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

const DataPicker = function() {
}

DataPicker.prototype.pick = function(playersJson, tiersJson) {
    var friends = [];
    var enemies = [];
    for (const id in playersJson) {
        const player = playersJson[id];

        // プレイヤーに関する成績
        var playerStat = {};
        playerStat.name = player.info.name;
        playerStat.clan_tag = player.clan_info != null ? "[" + player.clan_info.tag + "]" : "";
        if (!player.playerstat.hidden_profile) {
            const stat = player.playerstat.statistics
            playerStat.battles = stat.battles;
            playerStat.win_rate = (stat.pvp.wins / stat.pvp.battles * 100).toFixed(1)
            playerStat.average_damage = (stat.pvp.damage_dealt / stat.battles).toFixed(0);
            playerStat.kill_death_rate = (stat.pvp.frags / (stat.pvp.battles - stat.pvp.survived_battles)).toFixed(1);
        } else {
            playerStat.battles = 'hidden';
            playerStat.win_rate = 'hidden';
            playerStat.average_damage = 'hidden';
            playerStat.kill_death_rate = 'hidden';
        }

        // プレイヤーが使用する艦艇の成績
        var shipStat = {};
        if (player.shipstat != null) {
            logger.info(player.info.shipId);
            const stat = findShipStatById(player.shipstat, player.info.shipId);
            shipStat.battles = stat.battles;
            shipStat.win_rate = (stat.pvp.wins / stat.pvp.battles * 100).toFixed(1)
            shipStat.average_damage = (stat.pvp.damage_dealt / stat.battles).toFixed(0);
            shipStat.kill_death_rate = (stat.pvp.frags / (stat.pvp.battles - stat.pvp.survived_battles)).toFixed(1);
        } else {
            shipStat.battles = 'hidden';
            shipStat.win_rate = 'hidden';
            shipStat.average_damage = 'hidden';
            shipStat.kill_death_rate = 'hidden';
        }

        // プレイヤーが使用する艦艇の情報
        var shipInfo = {}
        shipInfo.name = player.shipinfo.name;
        shipInfo.type = player.shipinfo.type;
        shipInfo.tier = player.shipinfo.tier;
        shipInfo.nation = player.shipinfo.nation;
        shipInfo.detect_distance_by_ship = player.shipinfo.default_profile.concealment.detect_distance_by_ship;
        const camouflage_coefficient = 1 - 0.03;
        const module_coefficient = shipStat.tier > 7 ? 1 - 0.10 : 1;
        var commander_coefficient = 1;
        switch (shipInfo.type) {
            case "AirCarrier":
                commander_coefficient = 1 - 0.16;
                break;
            case "Battleship":
                commander_coefficient = 1 - 0.14;
                break;
            case "Cruiser":
                commander_coefficient = 1 - 0.12;
                break;
            case "Destroyer":
                commander_coefficient = 1 - 0.10;
                break;
            default:
                break;
        }
        const gearing_coefiicient = shipStat.name == "Gearing" ? 1 - 0.15 : 1; 
        shipInfo.detect_distance_by_ship = (shipInfo.detect_distance_by_ship * camouflage_coefficient * module_coefficient * commander_coefficient * gearing_coefiicient).toFixed(1);
        if (player.shipinfo.default_profile.torpedoes != null) {
            shipInfo.torpedoes_distance = player.shipinfo.default_profile.torpedoes.distance;
        } else {
            shipInfo.torpedoes_distance = "-";
        }
        
        var allStat = {};
        allStat.player_stat = playerStat;
        allStat.ship_stat = shipStat;
        allStat.ship_info = shipInfo;

        const relation = player.info.relation
        relation == 0 || relation == 1 ? friends.push(allStat) : enemies.push(allStat);
    }
    outputData = {};
    outputData.friends = friends.sort(sort_by_type_and_tier());
    outputData.enemies = enemies.sort(sort_by_type_and_tier());
    return outputData;
}

const findShipStatById = function (shipStats, shipId) {
    for (var shipStat of shipStats) {
        logger.info(shipStat.ship_id);
        if (shipId == shipStat.ship_id) {
            return shipStat;
        }
    }
    return null;
}

const sort_by_type_and_tier = function () {
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

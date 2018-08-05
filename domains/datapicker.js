const log4js = require('log4js');

const logger = log4js.getLogger();
logger.level = 'DEBUG';

const DataPicker = function() {
}

DataPicker.prototype.pick = function(data) {
    var friends = [];
    var enemies = [];
    for (const id in data) {
        const player = data[id];

        // プレイヤーに関する成績
        var playerStat = {};
        playerStat.name = player.info.name;
        // TODO クラン名
        if (!player.playerstat.hidden_profile) {
            const stat = player.playerstat.statistics
            playerStat.battles = stat.battles;
            playerStat.win_rate = (stat.pvp.wins / stat.pvp.battles * 100).toFixed(2)
            playerStat.average_damage = (stat.pvp.damage_dealt / stat.battles).toFixed(0);
            playerStat.kill_death_rate = (stat.pvp.frags / (stat.pvp.battles - stat.pvp.survived_battles)).toFixed(2);
        } else {
            playerStat.battles = 'hidden';
            playerStat.win_rate = 'hidden';
            playerStat.average_damage = 'hidden';
            playerStat.kill_death_rate = 'hidden';
        }

        // プレイヤーが使用する艦艇の成績
        var shipStat = {};
        if (player.shipstat != null) {
            const stat = player.shipstat;
            shipStat.battles = stat.battles;
            shipStat.win_rate = (stat.pvp.wins / stat.pvp.battles * 100).toFixed(2)
            shipStat.average_damage = (stat.pvp.damage_dealt / stat.battles).toFixed(0);
            shipStat.kill_death_rate = (stat.pvp.frags / (stat.pvp.battles - stat.pvp.survived_battles)).toFixed(2);
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
        shipInfo.detect_distance_by_ship = (shipInfo.detect_distance_by_ship * camouflage_coefficient * module_coefficient * commander_coefficient * gearing_coefiicient).toFixed(2);
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
    outputData.friends = friends;
    outputData.enemies = enemies;
    return outputData;
}

module.exports = DataPicker;

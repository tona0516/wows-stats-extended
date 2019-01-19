const Env = require('./Env');
const Config = require('./Config');

const _ = require('lodash');
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

class WoWsDataShaper {
    shape(players, allShips) {
        var friends = [];
        var enemies = [];
        for (const name in players) {
            try {
                const player = players[name];
                
                var personalData = {};
                personalData.name = name;
                personalData.wows_numbers = player.account_id !== null ? 'https://' + Env.region + '.' + Config.URL.WOWS_NUMBERS + player.account_id + ',' + name : null;
                personalData.is_myself = player.relation == 0 ? true : false;
                personalData.clan_tag = _.get(player, 'clan.tag', null);
                personalData.clan_tag = personalData.clan_tag !== null ? '[' + personalData.clan_tag + ']' : null;

                let playerStatistics = _.get(player, 'personal_data.statistics', null);
                if (playerStatistics !== null) {
                    if (!playerStatistics.hidden_profile) {
                        let pvp = playerStatistics.pvp;
                        personalData.battles = pvp.battles;
                        personalData.win_rate = (pvp.wins / pvp.battles * 100).toFixed(1);
                        personalData.average_damage = (pvp.damage_dealt / pvp.battles).toFixed(0);
                        personalData.kill_death_rate = (pvp.frags / (pvp.battles - pvp.survived_battles)).toFixed(1);
                        personalData.average_tier = calculateAverageTier(player.ship_statistics, allShips).toFixed(1);
                    } else {     
                        personalData.battles = '?';
                        personalData.win_rate = '?';
                        personalData.average_damage = '?';
                        personalData.kill_death_rate = '?';
                        personalData.average_tier = '?';
                    }
                } else {
                    personalData.battles = '0';
                    personalData.win_rate = '-';
                    personalData.average_damage = '-';
                    personalData.kill_death_rate = '-';
                    personalData.average_tier = '-';
                }

                var shipStat = {};
                let ship_id = player.ship_id;
                const theShipStatistics = pickShipStatisticsById(player.ship_statistics, ship_id);
                const theShipInfo = _.get(allShips, ship_id, null);
                if (theShipStatistics !== null && theShipInfo !== null) {
                    if (!playerStatistics.hidden_profile) {
                        let pvp = theShipStatistics.pvp;
                        shipStat.cp = calculateCombatPower(pvp, theShipInfo);
                        shipStat.battles = pvp.battles;
                        shipStat.win_rate = (pvp.wins / pvp.battles * 100).toFixed(1);
                        shipStat.average_damage = (pvp.damage_dealt / pvp.battles).toFixed(0);
                        shipStat.kill_death_rate = (pvp.frags / (pvp.battles - pvp.survived_battles)).toFixed(1);
                    } else {
                        shipStat.cp = '?';
                        shipStat.battles = '?';
                        shipStat.win_rate = '?';
                        shipStat.average_damage = '?';
                        shipStat.kill_death_rate = '?';
                    }
                } else {
                    shipStat.cp = '-'
                    shipStat.battles = '0';
                    shipStat.win_rate = '-';
                    shipStat.average_damage = '-';
                    shipStat.kill_death_rate = '-';
                }
    
                // プレイヤーが使用する艦艇の情報
                var shipInfo = {};
                shipInfo.name = allShips[ship_id].name;
                shipInfo.type = allShips[ship_id].type;
                shipInfo.tier = allShips[ship_id].tier;
                shipInfo.nation = allShips[ship_id].nation;
                shipInfo.detect_distance_by_ship = allShips[ship_id].default_profile.concealment.detect_distance_by_ship;
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
    
                shipInfo.detect_distance_by_ship = (shipInfo.detect_distance_by_ship * camouflage_coefficient * module_coefficient * commander_coefficient).toFixed(2);
    
                var allStat = {};
                allStat.player_stat = personalData;
                allStat.ship_stat = shipStat;
                allStat.ship_info = shipInfo;
    
                const relation = player.relation
                relation == 0 || relation == 1 ? friends.push(allStat) : enemies.push(allStat);
            } catch (error) {
                logger.error(`player_name=${name}, error=${error}`);
                continue;
            }
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

const pickShipStatisticsById = (ship_statistics, ship_id) => {
    if (ship_statistics === null) {
        return null;
    }

    for (stat of ship_statistics) {
        if (ship_id === stat.ship_id) {
            return stat;
        }
    }

    return null;
}

const calculateCombatPower = (stats, info) => {
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

    return (averageDamage * kdRatio * averageExperience / 800 * (1 - (0.03 * info.tier)) * type_param).toFixed(0);
}

const convertToRomanNumber = (team) => {
    for (var player of team) {
        player.ship_info.tier = TIER_ROMAN[player.ship_info.tier];
    }
    return team;
}

const calculateTeamAverage = (team) => {
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

const average = (array) => {
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

const calculateAverageTier = (shipStatistics, allShips) => {
    let battlesSum = 0;
    let tierSum = 0;
    for (var stat of shipStatistics) {
        let shipBattles = _.get(stat, 'pvp.battles', 0);
        let shipTier =  _.get(allShips, '[' + stat.ship_id + '].tier', 0);
        battlesSum += shipBattles;
        tierSum += shipBattles * shipTier;
    }
    return tierSum / battlesSum;
}

const sortByTypeAndTier = () => {
    return function (a, b) {
        // 艦種でソード
        var a_type = a.ship_info.type;
        var b_type = b.ship_info.type;
        a_type = a_type.toUpperCase();
        b_type = b_type.toUpperCase();
        if (a_type > b_type) return 1;
        if (a_type < b_type) return -1;

        // Tierでソート
        var a_tier = a.ship_info.tier;
        var b_tier = b.ship_info.tier;
        a_tier = parseInt(a_tier);
        b_tier = parseInt(b_tier);
        if (a_tier < b_tier) return 1;
        if (a_tier > b_tier) return -1;

        // 艦名でソート
        var a_name = a.ship_info.name;
        var b_name = b.ship_info.name;
        if (a_name > b_name) return 1;
        if (a_name < b_name) return -1;

        return 0;
    }
}

module.exports = WoWsDataShaper;

const Env = require('./Env');
const Config = require('./Config');
const Util = require('./Util');

const _ = require('lodash');

class WoWsDataShaper {

    constructor(players, allShips) {
        this.players = players;
        this.allShips = allShips;
    }

    shape() {
        let friends = [];
        let enemies = [];
        for (const name in this.players) {
            try {
                const player = this.players[name];

                const personalData = this._makePersonalData(name, player);

                const ship_id = player.ship_id;
                const shipStat = this._makeShipStatistics(ship_id, player);

                const shipInfo = this._makeShipInfo(ship_id);
    
                var allStat = {};
                allStat.player_stat = personalData;
                allStat.ship_stat = shipStat;
                allStat.ship_info = shipInfo;
    
                const relation = player.relation;
                relation == 0 || relation == 1 ? friends.push(allStat) : enemies.push(allStat);
            } catch (error) {
                logger.error(`Failed to make data for displaying in browser. player_name: ${name}, error: ${error}`);
                continue;
            }
        }

        const outputData = {};
        var sortedFriends = friends.sort(this._sortByTypeAndTier());
        sortedFriends = this._convertToRomanNumber(sortedFriends);
        sortedFriends.push(this._calculateTeamAverage(sortedFriends));
        
        var sortedEnemies = enemies.sort(this._sortByTypeAndTier());
        sortedEnemies = this._convertToRomanNumber(sortedEnemies);
        sortedEnemies.push(this._calculateTeamAverage(sortedEnemies));

        outputData.friends = sortedFriends;
        outputData.enemies = sortedEnemies;

        return outputData;
    }

    _makePersonalData(name, player) {
        let personalData = {};
        const isPrivate = _.get(player, 'personal_data.hidden_profile', false);

        personalData.name = name;
        personalData.wows_numbers = player.account_id !== null ? 'https://' + Env.region + '.' + Config.URL.WOWS_NUMBERS + player.account_id + ',' + name : null;
        personalData.is_myself = player.relation == 0 ? true : false;
        personalData.clan_tag = _.get(player, 'clan.tag', null);
        personalData.clan_tag = personalData.clan_tag !== null ? '[' + personalData.clan_tag + ']' : null;

        const playerStatistics = _.get(player, 'personal_data.statistics', null);

        if (isPrivate) {
            personalData.battles = '?';
            personalData.win_rate = '?';
            personalData.average_damage = '?';
            personalData.kill_death_rate = '?';
            personalData.average_tier = '?';
            return personalData;
        }

        if (playerStatistics === null || _.get(playerStatistics, 'pvp.battles') === 0) {
            personalData.battles = '0';
            personalData.win_rate = '-';
            personalData.average_damage = '-';
            personalData.kill_death_rate = '-';
            personalData.average_tier = '-';
            return personalData;
        }

        let pvp = playerStatistics.pvp;
        personalData.battles = pvp.battles;
        personalData.win_rate = (pvp.wins / pvp.battles * 100).toFixed(1);
        personalData.average_damage = (pvp.damage_dealt / pvp.battles).toFixed(0);
        personalData.kill_death_rate = (pvp.frags / (pvp.battles - pvp.survived_battles)).toFixed(1);
        personalData.average_tier = this._calculateAverageTier(player.ship_statistics).toFixed(1);
        return personalData;
    }

    _makeShipStatistics(ship_id, player) {
        let shipStatistics = {};
        const theShipStatistics = this._pickShipStatisticsById(player.ship_statistics, ship_id);
        const theShipInfo = _.get(this.allShips, ship_id, null);
        const isPrivate = _.get(player, 'personal_data.hidden_profile', false);

        if (isPrivate) {
            shipStatistics.cp = '?';
            shipStatistics.battles = '?';
            shipStatistics.win_rate = '?';
            shipStatistics.average_damage = '?';
            shipStatistics.kill_death_rate = '?';
            return shipStatistics;
        }

        if (theShipStatistics === null || theShipInfo === null || _.get(theShipStatistics, 'pvp.battles') === 0) {
            shipStatistics.cp = '-'
            shipStatistics.battles = '0';
            shipStatistics.win_rate = '-';
            shipStatistics.average_damage = '-';
            shipStatistics.kill_death_rate = '-';
            return shipStatistics;
        }

        let pvp = theShipStatistics.pvp;
        shipStatistics.cp = this._calculateCombatPower(pvp, theShipInfo);
        shipStatistics.battles = pvp.battles;
        shipStatistics.win_rate = (pvp.wins / pvp.battles * 100).toFixed(1);
        shipStatistics.average_damage = (pvp.damage_dealt / pvp.battles).toFixed(0);
        shipStatistics.kill_death_rate = (pvp.frags / (pvp.battles - pvp.survived_battles)).toFixed(1);
        return shipStatistics;
    }

    _makeShipInfo(ship_id) {
        var shipInfo = {};
        shipInfo.name = this.allShips[ship_id].name;
        shipInfo.type = this.allShips[ship_id].type;
        shipInfo.tier = this.allShips[ship_id].tier;
        shipInfo.nation = this.allShips[ship_id].nation;
        shipInfo.detect_distance_by_ship = this._calculateConcealment(ship_id, this.allShips);
        return shipInfo;
    }

    _calculateConcealment(ship_id) {
        const detect_distance_by_ship = this.allShips[ship_id].default_profile.concealment.detect_distance_by_ship;
        const camouflage_coefficient = 1.00 - 0.03;
        let module_coefficient = 1.00;
        if (this.allShips[ship_id].name == "Gearing") {
            module_coefficient = 1.00 - 0.15;
        } else if (this.allShips[ship_id].tier > 7) {
            module_coefficient = 1.00 - 0.10;
        }
        var commander_coefficient = 1;
        switch (this.allShips[ship_id].type) {
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

        return (detect_distance_by_ship * camouflage_coefficient * module_coefficient * commander_coefficient).toFixed(2);
    }

    _calculateAverageTier(ship_Statistics) {
        let battlesSum = 0;
        let tierSum = 0;
        for (let stat of ship_Statistics) {
            let shipBattles = _.get(stat, 'pvp.battles', 0);
            let shipTier =  _.get(this.allShips, '[' + stat.ship_id + '].tier', 0);
            battlesSum += shipBattles;
            tierSum += shipBattles * shipTier;
        }
        return tierSum / battlesSum;
    }

    _pickShipStatisticsById(ship_statistics, ship_id) {
        if (ship_statistics === null) {
            return null;
        }
    
        for (let stat of ship_statistics) {
            if (ship_id === stat.ship_id) {
                return stat;
            }
        }
    
        return null;
    }

    _calculateCombatPower(pvp, info) {
        const kill = pvp.frags;
        const death = pvp.battles - pvp.survived_battles;
        const averageDamage = pvp.damage_dealt / pvp.battles;
        const averageExperience = pvp.xp / pvp.battles;
    
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
    
    _convertToRomanNumber(team) {
        for (var player of team) {
            player.ship_info.tier = Util.romanNumber(player.ship_info.tier);
        }
        return team;
    }
    
    _calculateTeamAverage(team) {
        let shipStat = {};
        shipStat.battles = this._average(team.map(x => x.ship_stat.battles)).toFixed(0);
        shipStat.win_rate = this._average(team.map(x => x.ship_stat.win_rate)).toFixed(1);
        shipStat.average_damage = this._average(team.map(x => x.ship_stat.average_damage)).toFixed(0);
        shipStat.kill_death_rate = this._average(team.map(x => x.ship_stat.kill_death_rate)).toFixed(1);

        let playerStat = {};
        playerStat.name = "チーム平均";
        playerStat.battles = this._average(team.map(x => x.player_stat.battles)).toFixed(0);
        playerStat.win_rate = this._average(team.map(x => x.player_stat.win_rate)).toFixed(1);
        playerStat.average_damage = this._average(team.map(x => x.player_stat.average_damage)).toFixed(0);
        playerStat.kill_death_rate = this._average(team.map(x => x.player_stat.kill_death_rate)).toFixed(1);
        playerStat.average_tier = this._average(team.map(x => x.player_stat.average_tier)).toFixed(1);
        
        let shipInfo = {};

        var allStat = {};
        allStat.player_stat = playerStat;
        allStat.ship_stat = shipStat;
        allStat.ship_info = shipInfo;
    
        return allStat;
    }
    
    _average(array) {
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
    
    _sortByTypeAndTier() {
        return function (a, b) {
            // 艦種でソート
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
}

module.exports = WoWsDataShaper;

const request = require('request');
const log4js = require('log4js');
const async = require('async');

const logger = log4js.getLogger();
logger.level = 'DEBUG';

const REQUEST_LIMIT = 10;

const DataFetcher = function() {
    this.isRunning = false;
}

DataFetcher.prototype.fetch = async function(json, callback) {
    this.isRunning = true
    await this.fetchPlayer(json);
    await this.fetchPlayerStat();
    await this.fetchPlayerShipStat();
    await this.fetchShipInfo();
    this.isRunning = false;
    return callback();
}

DataFetcher.prototype.fetchPlayer = function(json) {
    const playersFromArenaInfo = extractPlayers(json);
    const players = {}
    const _this = this;
    return new Promise((resolve, reject) => {
        async.eachLimit(playersFromArenaInfo, REQUEST_LIMIT, function(playerFromArenaInfo, next) {
            request.get({
                url: 'http://localhost:3000/apis/playerId',
                qs: {
                    playername: playerFromArenaInfo.name
                }
            }, function(error, response, json) {
                const id = JSON.parse(json)['playerid'];
                players[id] = {};
                players[id].info = playerFromArenaInfo;
                next();
            });
        }, function(error) {
            _this.players = players;
            if (error) {
                return reject(error);
            }
            return resolve()
        });
    });
}

DataFetcher.prototype.fetchPlayerStat = function() {
    const _this = this;
    return new Promise((resolve, reject) => {
        const playerIds = [];
        for (const id in _this.players) {
            playerIds.push(id);
        }
        const playerIdsString = playerIds.join(',');
        request.get({
            url: 'http://localhost:3000/apis/stat/player',
            qs: {
                playerid: playerIdsString
            }
        }, function(error, response, json) {
            const data = JSON.parse(json)['data'];
            for (const id in data) {
                _this.players[id].playerstat = data[id];
            }
            if (error) {
                return reject(error);
            }
            return resolve()
        });
    });
}

DataFetcher.prototype.fetchPlayerShipStat = function() {
    const _this = this;
    return new Promise((resolve, reject) => {
        async.mapValuesLimit(_this.players, REQUEST_LIMIT, function(value, id, next) {
            request.get({
                url: 'http://localhost:3000/apis/stat/ship',
                qs: {
                    playerid: id,
                    shipid: _this.players[id].info.shipId
                }
            }, function(error, response, json) {
                const data = JSON.parse(json)['data'];
                if(data[id] != undefined) {
                    _this.players[id].shipstat = data[id][0];
                } else {
                    _this.players[id].shipstat = null;
                }
                next();
            });
        }, function(error) {
            if (error) {
                return reject(error);
            }
            return resolve()
        });
    });
}

DataFetcher.prototype.fetchShipInfo = function() {
    const _this = this;
    return new Promise((resolve, reject) => {
        const shipIds = [];
        for (var id in _this.players) {
            shipIds.push(_this.players[id].info.shipId);
        }
        const shipIdsString = shipIds.join(',');

        request.get({
            url: 'http://localhost:3000/apis/info/ship',
            qs: {
                shipid: shipIdsString
            }
        }, function(error, response, json) {
            const data = JSON.parse(json)['data'];
            for (const playerId in _this.players) {
                for (const shipId in data) {
                    if (_this.players[playerId].info.shipId == shipId) {
                        _this.players[playerId].shipinfo = data[shipId];
                        break;
                    }
                }
            }
            if (error) {
                return reject(error);
            }
            return resolve()
        });
    });
}

DataFetcher.prototype.fetchBattleInfo = function() {
    // TODO
}

const extractPlayers = function(json) {
    const players = [];
    for (const vehicleIndex in json['vehicles']) {
        const player = json['vehicles'][vehicleIndex];
        players.push(player);
    } 
    return players;
}

module.exports = DataFetcher;

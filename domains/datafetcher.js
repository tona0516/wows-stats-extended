const request = require('request');
const log4js = require('log4js');
const async = require('async');

const logger = log4js.getLogger();
logger.level = 'DEBUG';

const REQUEST_LIMIT = 10;

const DataFetcher = function() {
    this.isRunning = false;
    this.shipTierData = null;
}

DataFetcher.prototype.fetch = async function(json, callback) {
    this.isRunning = true;
    await this.fetchPlayer(json);
    await this.fetchPlayerStat();
    await this.fetchPlayerShipStat();
    await this.fetchShipInfo();
    await this.fetchClanInfo();
    if (this.shipTierData == null) {
        this.fetchShipTier();
    }
    this.isRunning = false;
    return callback(this.players, this.shipTierData);
}

DataFetcher.prototype.fetchPlayer = function(json) {
    const playersFromArenaInfo = extractPlayers(json);
    const players = {}
    const _this = this;
    return new Promise((resolve, reject) => {
        async.eachLimit(playersFromArenaInfo, REQUEST_LIMIT, function(playerFromArenaInfo, next) {
            request.get({
                url: 'http://localhost:3000/apis/playerid',
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
            if (error != null) {
                return reject(error);
            }
            return resolve();
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
            if (error) {
                return reject(error);
            }
            const data = JSON.parse(json).data;
            for (const id in data) {
                _this.players[id].playerstat = data[id];
            }
            return resolve();
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
                    playerid: id
                }
            }, function(error, response, json) {
                const data = JSON.parse(json)['data'];
                if(data[id] != undefined) {
                    _this.players[id].shipstat = data[id];
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
            if (error) {
                return reject(error);
            }
            const data = JSON.parse(json)['data'];
            for (const playerId in _this.players) {
                for (const shipId in data) {
                    if (_this.players[playerId].info.shipId == shipId) {
                        _this.players[playerId].shipinfo = data[shipId];
                        break;
                    }
                }
            }
            return resolve();
        });
    });
}

DataFetcher.prototype.fetchClanInfo = function() {
    const _this = this;
    return new Promise((resolve, reject) => {
        const playerIds = [];
        for (const id in _this.players) {
            playerIds.push(id);
        }
        const playerIdsString = playerIds.join(',');
        request.get({
            url: 'http://localhost:3000/apis/clanid',
            qs: {
                playerid: playerIdsString
            }
        }, function(error, response, json) {
            if (error) {
                return reject(error);
            }
            const data = JSON.parse(json).data;
            const clanIds = [];
            const clanIdPlayerIdMap = {};
            for (const id in data) {
                if (data[id] != null) {
                    clanIds.push(data[id].clan_id);
                    clanIdPlayerIdMap[data[id].clan_id] = id;
                }
            }
            const clanIdsString = clanIds.join(',');
            request.get({
                url: 'http://localhost:3000/apis/info/clan',
                qs: {
                    clanid: clanIdsString
                }
            }, function(error, response, json) {
                if (error) {
                    return reject(error);
                }
                const data = JSON.parse(json).data;
                for (const clanId in data) {
                    _this.players[clanIdPlayerIdMap[clanId]].clan_info = data[clanId];
                }
                for (const playerId in _this.players) {
                    if (_this.players[playerId].clan_info === void 0) {
                        _this.players[playerId].clan_info = null;
                    }
                }
                return resolve();
            })
        });
    });
}

DataFetcher.prototype.fetchShipTier = async function(pageNO, json) {
    var json = {};
    var pageNo = 0;
    var pageTotal = 0;
    do {
        const body = await this.fetchShipTierByPage(++pageNo);
        const newJson = JSON.parse(body);
        for (var id in newJson) {
            json[id] = newJson[id];
        }
        pageTotal = newJson.meta.page_total;
    } while(pageNo != pageTotal);
    this.tiersJson = json;
}

DataFetcher.prototype.fetchShipTierByPage = function(pageNo) {
    return new Promise((resolve, reject) => {
        request.get({
            url: 'http://localhost:3000/apis/info/ship_tier',
            qs: {
                page_no: pageNo
            }
        }, function(error, response, body) {
            if (error) {
                return reject(error);
            }
            return resolve(body);
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

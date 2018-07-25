var request = require('request');
var log4js = require('log4js');
var async = require('async');

var logger = log4js.getLogger();
logger.level = 'DEBUG';

let REQUEST_LIMIT = 10;

var DataFetcher = function(json) {
    this.json = json;
}

DataFetcher.prototype.fetch = async function(callback) {
    await this.fetchPlayer();
    await this.fetchPlayerStat();
    await this.fetchPlayerShipStat();
    await this.fetchShipInfo();
    callback();
}

DataFetcher.prototype.fetchPlayer = async function() {
    var playersFromArenaInfo = extractPlayers(this.json);
    var players = {}
    var _this = this;
    return new Promise((resolve, reject) => {
        async.eachLimit(playersFromArenaInfo, REQUEST_LIMIT, function(playerFromArenaInfo, next) {
            var url = {
                url: 'http://localhost:3000/apis/playerId',
                qs: {
                    playername: playerFromArenaInfo.name
                }
            };
            request.get(url, function(error, response, json) {
                var id = JSON.parse(json)['playerid'];
                players[id] = {};
                players[id].info = playerFromArenaInfo;
                next();
            });
        }, function(error) {
            _this.players = players;
            // logger.debug(_this.players);
            error ? reject(error) : resolve()
        });
    });
}

DataFetcher.prototype.fetchPlayerStat = async function() {
    var _this = this;
    return new Promise((resolve, reject) => {
        var playerIds = [];
        for (var id in _this.players) {
            playerIds.push(id);
        }
        playerIds = playerIds.join(',');
        var url = {
            url: 'http://localhost:3000/apis/stat/player',
            qs: {
                playerid: playerIds
            }
        };
        request.get(url, function(error, response, json) {
            var data = JSON.parse(json)['data'];
            for (var id in data) {
                _this.players[id].playerstat = data[id];
            }
            // logger.debug(_this.players);
            error ? reject(error) : resolve()
        });
    });
}

DataFetcher.prototype.fetchPlayerShipStat = async function() {
    var _this = this;
    return new Promise((resolve, reject) => {
        async.mapValuesLimit(_this.players, REQUEST_LIMIT, function(value, key, next) {
            var id = key
            var url = {
                url: 'http://localhost:3000/apis/stat/ship',
                qs: {
                    playerid: id,
                    shipid: _this.players[id].info.shipId
                }
            };
            request.get(url, function(error, response, json) {
                var data = JSON.parse(json)['data'];
                if(data[id] != undefined) {
                    _this.players[id].shipstat = data[id][0];
                } else {
                    _this.players[id].shipstat = null;
                }
                next();
            });
        }, function(error) {
            // logger.debug(_this.players);
            error ? reject(error) : resolve()
        });
    });
}

DataFetcher.prototype.fetchShipInfo = async function() {
    var _this = this;
    return new Promise((resolve, reject) => {
        var shipIds = [];
        for (var id in _this.players) {
            shipIds.push(_this.players[id].info.shipId);
        }
        shipIds = shipIds.join(',');
        var url = {
            url: 'http://localhost:3000/apis/info/ship',
            qs: {
                shipid: shipIds
            }
        };
        request.get(url, function(error, response, json) {
            var data = JSON.parse(json)['data'];
            for (var playerId in _this.players) {
                for (var shipId in data) {
                    if (_this.players[playerId].info.shipId == shipId) {
                        _this.players[playerId].shipinfo = data[shipId];
                        break;
                    }
                }
            }
            logger.debug(_this.players);
            error ? reject(error) : resolve()
        });
    });
}

DataFetcher.prototype.fetchBattleInfo = function() {
    // TODO
}

var extractPlayers = function(json) {
    var players = [];
    for (var vehicleIndex in json['vehicles']) {
        var player = json['vehicles'][vehicleIndex];
        players.push(player);
    } 
    return players;
}

var requestByGet = function(url, qs) {
    return new Promise((resolve, reject) => {
        request.get({
            url: url,
            qs: qs,
        }, function(error, response, body) {
            error ? reject(error) : resolve(body);
        });
    });
}

module.exports = DataFetcher;

const request = require('request');
const rp = require('request-promise');
const log4js = require('log4js');
const async = require('async');

const logger = log4js.getLogger();
logger.level = 'DEBUG';

const REQUEST_LIMIT = 10;

const DataFetcher = function() {
    this.players = {};
}

DataFetcher.prototype.fetch = async function(json, callback) {
    await this.fetchPlayerId(json);
    await this.fetchPlayerStat();
    await this.fetchPlayerShipStat();
    await this.fetchShipInfo();
    await this.fetchClanInfo();
    if (this.tiersJson == null) {
        await this.fetchShipTier();
    }
    return callback(this.players, this.tiersJson);
}

DataFetcher.prototype.fetchPlayerId = function(json) {
    const _this = this;
    return new Promise((resolve, reject) => {
        // tempArenaInfoからプレイヤー情報を取得
        const playersFromArenaInfo = extractPlayers(json);

        // コンマ区切りのプレイヤー名文字列を生成
        const playerNames = [];
        for (const player of playersFromArenaInfo) {
            playerNames.push(player.name);
        }
        const joinedPlayerNames = playerNames.join(",");

        // プレイヤー名からIDを取得
        rp({
            url: 'http://localhost:3000/apis/playerid',
            qs: {
                search: joinedPlayerNames
            }
        })
        .then(function (body) {
            const json = JSON.parse(body);
            for (var player of json.data) {
                const playerId = player.account_id;
                const playerName = player.nickname;
                _this.players[playerId] = {};
                for (var playerFromArenaInfo of playersFromArenaInfo) {
                    if (playerName === playerFromArenaInfo.name) {
                        _this.players[playerId].info = playerFromArenaInfo;
                        break;
                    }
                }
            }
            return resolve();
        })
        .catch(function (error) {
            logger.error(error);
            return reject();
        });
    });
}

DataFetcher.prototype.fetchPlayerStat = function() {
    const _this = this;
    return new Promise((resolve, reject) => {
        // コンマ区切りのプレイヤーID文字列を生成
        const playerIds = [];
        for (const id in _this.players) {
            playerIds.push(id);
        }
        const playerIdsString = playerIds.join(',');

        // IDから詳細なプレイヤー統計を取得
        rp({
            url: 'http://localhost:3000/apis/stat/player',
            qs: {
                playerid: playerIdsString
            }
        })
        .then(function (body) {
            const json = JSON.parse(body);
            for (const id in json.data) {
                _this.players[id].playerstat = json.data[id];
            }
            resolve();
        })
        .catch(function (error) {
            logger.error(error);
            reject();
        });
    });
}

DataFetcher.prototype.fetchPlayerShipStat = function() {
    const _this = this;
    return new Promise((resolve, reject) => {
        async.mapValuesLimit(_this.players, REQUEST_LIMIT, function(value, id, next) {
            // 各プレイヤーの使用艦艇の統計を並列で取得する
            rp({
                url: 'http://localhost:3000/apis/stat/ship',
                qs: {
                    playerid: id
                }
            })
            .then(function (body) {
                const json = JSON.parse(body);
                _this.players[id].shipstat = json.data[id] != undefined ? json.data[id] : null;
                next();
            })
            .catch(function (error) {
                logger.error(error);
                _this.players[id].shipstat = null;
                next();
            });
        }, function(error) {
            if (error) {
                logger.error(error);
                return reject();
            }
            return resolve()
        });
    });
}

DataFetcher.prototype.fetchShipInfo = function() {
    const _this = this;
    return new Promise((resolve, reject) => {
        // コンマ区切りの艦艇ID文字列を生成
        const shipIds = [];
        for (var id in _this.players) {
            shipIds.push(_this.players[id].info.shipId);
        }
        const shipIdsString = shipIds.join(',');

        // IDから艦艇情報を取得する
        rp({
            url: 'http://localhost:3000/apis/info/ship',
            qs: {
                shipid: shipIdsString
            }
        })
        .then(function (body) {
            const json = JSON.parse(body);
            for (const playerId in _this.players) {
                for (const shipId in json.data) {
                    if (_this.players[playerId].info.shipId == shipId) {
                        _this.players[playerId].shipinfo = json.data[shipId];
                        break;
                    }
                }
            }
            resolve();
        })
        .catch(function (error) {
            logger.error(error);
            reject();
        });
    });
}

DataFetcher.prototype.fetchClanInfo = function() {
    const _this = this;
    return new Promise((resolve, reject) => {
        // コンマ区切りのプレイヤーID文字列を生成
        const playerIds = [];
        for (const id in _this.players) {
            playerIds.push(id);
        }
        const playerIdsString = playerIds.join(',');

        // プレイヤーIDからクラン名を取得する
        const clanIdPlayerIdMap = {};
        rp({
            url: 'http://localhost:3000/apis/clanid',
            qs: {
                playerid: playerIdsString
            }
        })
        .then(function (body) {
            const json = JSON.parse(body);
            const data = json.data;
            const clanIds = [];
            for (const id in data) {
                if (data[id] != null) {
                    clanIds.push(data[id].clan_id);
                    clanIdPlayerIdMap[data[id].clan_id] = id;
                }
            }
            const clanIdsString = clanIds.join(',');
            return rp({
                url: 'http://localhost:3000/apis/info/clan',
                qs: {
                    clanid: clanIdsString
                }
            });
        })
        .then(function (body) {
            const json = JSON.parse(body);
            const data = json.data;
            for (const clanId in data) {
                _this.players[clanIdPlayerIdMap[clanId]].clan_info = data[clanId];
            }
            for (const playerId in _this.players) {
                if (_this.players[playerId].clan_info === undefined) {
                    _this.players[playerId].clan_info = null;
                }
            }
            resolve();
        })
        .catch(function (error) {
            logger.error(error);
            reject();
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
        for (var id in newJson.data) {
            json[id] = newJson.data[id];
        }
        pageTotal = newJson.meta.page_total;
    } while(pageNo != pageTotal);
    this.tiersJson = json;
}

DataFetcher.prototype.fetchShipTierByPage = function(pageNo) {
    return new Promise((resolve, reject) => {
        rp({
            url: 'http://localhost:3000/apis/info/ship_tier',
            qs: {
                page_no: pageNo
            }
        })
        .then(function (body) {
            resolve(body);
        })
        .catch(function (error) {
            logger.error(error);
            reject();
        });
    });
}

DataFetcher.prototype.fetchBattleInfo = function() {
    // TODO
}

const extractPlayers = function(json) {
    const players = [];
    for (const vehicleIndex in json.vehicles) {
        const player = json.vehicles[vehicleIndex];
        players.push(player);
    } 
    return players;
}

module.exports = DataFetcher;

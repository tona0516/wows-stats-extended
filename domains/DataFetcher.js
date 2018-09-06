const rp = require('request-promise');
const log4js = require('log4js');
const async = require('async');
const Util = require('./Util');

const logger = log4js.getLogger();
logger.level = 'DEBUG';

class DataFetcher {
    constructor(requestLimit = 10) {
        this.requestLimit = requestLimit;
        this.players = {};
    }

    async fetch(json, callback) {
        await this.fetchPlayerId(json);
        await this.fetchPlayerStats();
        await this.fetchPlayerShipStats();
        await this.fetchShipInfo();
        await this.fetchClanInfo();
        await this.fetchShipTier();
        return callback(this.players, this.tiersJson);
    }
    
    fetchPlayerId(json) {
        const self = this;
        return new Promise((resolve, reject) => {
            const playersFromArenaInfo = extractPlayers(json);

            // カンマ区切りのプレイヤー名の文字列を生成
            const joinedPlayerNames = Util.joinByComma(Object.keys(playersFromArenaInfo));
    
            // プレイヤー名からIDを取得
            rp({
                url: 'http://localhost:3000/apis/playerid',
                qs: {
                    search: joinedPlayerNames
                }
            })
            .then(function(body) {
                const data = JSON.parse(body).data;
                for (var player of data) {
                    const playerId = player.account_id;
                    const playerName = player.nickname;
                    self.players[playerId] = {};
                    self.players[playerId].info = playersFromArenaInfo[playerName];
                }
                return resolve();
            })
            .catch(function(error) {
                logger.error(error);
                return reject(error);
            });
        });
    }
    
    fetchPlayerStats() {
        const self = this;
        return new Promise((resolve, reject) => {
            // コンマ区切りのプレイヤーID文字列を生成
            const joinedPlayerIds = Util.joinByComma(Object.keys(self.players));
    
            // IDから詳細なプレイヤー統計を取得
            rp({
                url: 'http://localhost:3000/apis/stat/player',
                qs: {
                    playerid: joinedPlayerIds
                }
            })
            .then(function (body) {
                const data = JSON.parse(body).data;
                for (const id in data) {
                    self.players[id].playerstat = data[id];
                }
                resolve();
            })
            .catch(function (error) {
                logger.error(error);
                reject();
            });
        });
    }
    
    fetchPlayerShipStats() {
        const self = this;
        return new Promise((resolve, reject) => {
            async.mapValuesLimit(self.players, self.requestLimit, function(value, id, next) {
                // 各プレイヤーの使用艦艇の統計を並列で取得する
                rp({
                    url: 'http://localhost:3000/apis/stat/ship',
                    qs: {
                        playerid: id
                    }
                })
                .then(function (body) {
                    const json = JSON.parse(body);
                    self.players[id].shipstat = json.data[id] != undefined ? json.data[id] : null;
                    next();
                })
                .catch(function (error) {
                    logger.error(error);
                    self.players[id].shipstat = null;
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
    
    fetchShipInfo() {
        const self = this;
        return new Promise((resolve, reject) => {
            // コンマ区切りの艦艇ID文字列を生成
            const joinedShipIds = Util.joinByComma(Object.keys(self.players).map(playerId => self.players[playerId].info.shipId));
    
            // IDから艦艇情報を取得する
            rp({
                url: 'http://localhost:3000/apis/info/ship',
                qs: {
                    shipid: joinedShipIds
                }
            })
            .then(function (body) {
                const data = JSON.parse(body).data;
                for (const playerId in self.players) {
                    const shipId =  self.players[playerId].info.shipId;
                    self.players[playerId].shipinfo = data[shipId];
                }
                resolve();
            })
            .catch(function (error) {
                logger.error(error);
                reject();
            });
        });
    }
    
    fetchClanInfo() {
        const self = this;
        return new Promise((resolve, reject) => {
            // コンマ区切りのプレイヤーID文字列を生成
            const joinedPlayerIds = Util.joinByComma(Object.keys(self.players));
    
            // プレイヤーIDをキーとしたクランIDのマップ
            const clanIdMap = {};

            // プレイヤーIDからクラン名を取得する
            rp({
                url: 'http://localhost:3000/apis/clanid',
                qs: {
                    playerid: joinedPlayerIds
                }
            })
            .then(function (body) {
                const data = JSON.parse(body).data;
                const clanIds = [];
                for (const playerId in data) {
                    if (data[playerId] !== null) {
                        const clanId = data[playerId].clan_id
                        clanIds.push(clanId);
                        clanIdMap[playerId] = clanId;
                    }
                }
                const joinedClanIds = clanIds.join(',');
                return rp({
                    url: 'http://localhost:3000/apis/info/clan',
                    qs: {
                        clanid: joinedClanIds
                    }
                });
            })
            .then(function (body) {
                const data = JSON.parse(body).data;
                for (const playerId in self.players) {
                    const clanInfo = data[clanIdMap[playerId]];
                    self.players[playerId].clan_info = clanInfo !== null ? clanInfo : null;
                }
                resolve();
            })
            .catch(function (error) {
                logger.error(error);
                reject();
            });
        });
    }
    
    async fetchShipTier() {
        var json = {};
        var pageNo = 0;
        var pageTotal = 0;
        do {
            const body = await fetchShipTierByPage(++pageNo);
            const newJson = JSON.parse(body);
            for (var id in newJson.data) {
                json[id] = newJson.data[id];
            }
            pageTotal = newJson.meta.page_total;
        } while(pageNo != pageTotal);
        this.tiersJson = json;
    }
}

const fetchShipTierByPage = function(pageNo) {
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

/**
 * プレイヤー名をキーとしたtempArenaInfoの連想配列を返却する
 * @param {Object} json tempArenaInfo.jsonの連想配列
 */
const extractPlayers = function(json) {
    const players = {};
    for (const player of json.vehicles) {
        players[player.name] = player;
    } 
    return players;
}

module.exports = DataFetcher;

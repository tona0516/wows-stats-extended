const rp = require('request-promise');
const log4js = require('log4js');
const async = require('async');
const Util = require('./Util');

const logger = log4js.getLogger();
logger.level = 'DEBUG';

class DataFetcher {

    /**
     * コンストラクタ
     * 
     * @param {Number} parallelRequestLimit 艦種別統計データを取得するときの最大並列数 
     */
    constructor(parallelRequestLimit = 10) {
        this.parallelRequestLimit = parallelRequestLimit;
        this.players = {};
    }

    /**
     * 
     * @param {Object} json tempArenaInfo.json 
     * @param {*} callback (統計データ,Tierデータ,エラー)を返却するコールバック関数
     */
    async fetch(json, callback) {
        await this.fetchPlayerId(json)
        .then(async () => {
            await this.fetchPlayerStats();
            await this.fetchPlayerShipStats();
            await this.fetchShipInfo();
            await this.fetchClanInfo();
            await this.fetchShipTier();
            return callback(this.players, this.tiers, null);
        })
        .catch((error) => {
            return callback({}, {}, error);
        })
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
                for (const playerId in data) {
                    self.players[playerId].playerstat = data[playerId];
                }
                return resolve();
            })
            .catch(function (error) {
                logger.error(error);
                return reject(error);
            });
        });
    }
    
    fetchPlayerShipStats() {
        const self = this;
        return new Promise((resolve, reject) => {
            async.mapValuesLimit(self.players, self.parallelRequestLimit, function(value, playerId, next) {
                // 各プレイヤーの使用艦艇の統計を並列で取得する
                rp({
                    url: 'http://localhost:3000/apis/stat/ship',
                    qs: {
                        playerid: playerId
                    }
                })
                .then(function (body) {
                    const data = JSON.parse(body).data;
                    self.players[playerId].shipstat = (data[playerId] !== null) ? data[playerId] : null;
                    next();
                })
                .catch(function (error) {
                    logger.error(error);
                    self.players[playerId].shipstat = null;
                    next();
                });
            }, function(error) {
                if (error) {
                    logger.error(error);
                    return reject(error);
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
                return resolve();
            })
            .catch(function (error) {
                logger.error(error);
                return reject(error);
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
            .then(function(body) {
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
            .then(function(body) {
                const data = JSON.parse(body).data;
                for (const playerId in self.players) {
                    try {
                        const clanId = clanIdMap[playerId];
                        const clanInfo = data[clanId];
                        self.players[playerId].clan_info = clanInfo;
                    } catch (e) {
                        self.players[playerId].clan_info = null;
                    }
                }
                return resolve();
            })
            .catch(function(error) {
                logger.error(error);
                return reject(error);
            });
        });
    }
    
    async fetchShipTier() {
        var allShip = {};
        var pageNo = 0;
        var pageTotal = 0;
        do {
            const body = await fetchShipTierByPage(++pageNo);
            const newJson = JSON.parse(body);
            const data = newJson.data
            pageTotal = newJson.meta.page_total;
            for (var shipId in data) {
                allShip[shipId] = data[shipId];
            }
        } while(pageNo != pageTotal);
        this.tiers = allShip;
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

const extractPlayers = function(json) {
    const players = {};
    for (const player of json.vehicles) {
        // COMの場合は除外する
        if (player.name.startsWith(':') && player.name.endsWith(':')) {
            continue;
        }

        // シナリオの敵船の場合は除外する
        if (player.id < 0) {
            continue;
        }

        players[player.name] = player;
    } 
    return players;
}

module.exports = DataFetcher;

const rp = require('request-promise');
const log4js = require('log4js');
const async = require('async');
const Util = require('./Util');
const Env = require('./Env');
const EntryPoint = require('./EntryPoint');

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
        Env.refresh();
        this.baseUrl = 'http://localhost:' + Env.port;
    }

    /**
     * 
     * @param {Object} json tempArenaInfo.json 
     * @param {*} callback (統計データ,Tierデータ,エラー)を返却するコールバック関数
     */
    async fetch(json, callback) {
        await this.fetchPlayerId(json).then(async () => {
            await this.fetchShipTierIfNeeded().catch((error) => {return callback(null, null, error)});
            this.fetchShipInfo(); // fetchShipTierIfNeededの後にコール
            await this.fetchPlayerStats().catch((error) => {return callback(null, null, error)});
            await this.fetchPlayerShipStats().catch((error) => {return callback(null, null, error)});
            await this.fetchClanInfo().catch((error) => {return callback(null, null, error)});
            return callback(this.players, this.tiers, null);
        }).catch((error) => {
            return callback(null, null, error);
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
                url: self.baseUrl + '/internal_api' + EntryPoint.Internal.PLAYER.ID,
                qs: {
                    search: joinedPlayerNames
                }
            }).then((body) => {
                const data = JSON.parse(body).data;
                for (var player of data) {
                    const playerId = player.account_id;
                    const playerName = player.nickname;
                    self.players[playerId] = {};
                    self.players[playerId].info = playersFromArenaInfo[playerName];
                }
                return resolve();
            }).catch((error) => {
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
                url: self.baseUrl + '/internal_api' + EntryPoint.Internal.PLAYER.STAT,
                qs: {
                    playerid: joinedPlayerIds
                }
            }).then((body) => {
                const data = JSON.parse(body).data;
                for (const playerId in data) {
                    self.players[playerId].playerstat = Util.isValid(data[playerId]) ? data[playerId] : null;
                }
                return resolve();
            }).catch((error) => {
                logger.error(error);
                return reject(error);
            });
        });
    }

    fetchPlayerShipStats() {
        const self = this;
        return new Promise((resolve, reject) => {
            async.mapValuesLimit(self.players, self.parallelRequestLimit, (value, playerId, next) => {
                // 各プレイヤーの使用艦艇の統計を並列で取得する
                rp({
                    url: self.baseUrl + '/internal_api' + EntryPoint.Internal.SHIP.STAT,
                    qs: {
                        playerid: playerId
                    }
                }).then((body) => {
                    const data = JSON.parse(body).data;
                    self.players[playerId].shipstat = Util.isValid(data[playerId]) ? data[playerId] : null;
                    next();
                }).catch((error) => {
                    logger.error(error);
                    self.players[playerId].shipstat = null;
                    next();
                });
            }, (error) => {
                if (error) {
                    logger.error(error);
                    return reject(error);
                }
                return resolve()
            });
        });
    }

    fetchShipInfo() {
        for (const playerId in this.players) {
            const shipId = this.players[playerId].info.shipId;
            this.players[playerId].shipinfo = this.tiers[shipId];
        }
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
                url: self.baseUrl + '/internal_api' + EntryPoint.Internal.CLAN.ID,
                qs: {
                    playerid: joinedPlayerIds
                }
            }).then((body) => {
                const data = JSON.parse(body).data;
                const clanIds = [];
                for (const playerId in data) {
                    if (Util.isValid(data[playerId])) {
                        const clanId = data[playerId].clan_id
                        clanIds.push(clanId);
                        clanIdMap[playerId] = clanId;
                    }
                }
                const joinedClanIds = clanIds.join(',');
                return rp({
                    url: self.baseUrl + '/internal_api' + EntryPoint.Internal.CLAN.INFO,
                    qs: {
                        clanid: joinedClanIds
                    }
                });
            }).then((body) => {
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
            }).catch((error) => {
                logger.error(error);
                return reject(error);
            });
        });
    }

    async fetchShipTierIfNeeded() {
        const currentGameVersion = await fetchGameVerision(this.baseUrl);
        const filePath = '.ships_' + currentGameVersion + '.json'
        const isExist = Util.checkFile(filePath);

        if (!isExist) {
            this.tiers = await fetchShipTier(this.baseUrl);
        } else {
            const contents = Util.readFile(filePath);
            this.tiers = JSON.parse(contents);
        }
        Util.writeFile(filePath, JSON.stringify(this.tiers));
    }
}

const fetchShipTier = async (baseUrl) => {
    var allShip = {};
    var pageNo = 0;
    var pageTotal = 0;
    do {
        const body = await fetchShipTierByPage(baseUrl, ++pageNo);
        const newJson = JSON.parse(body);
        const data = newJson.data
        pageTotal = newJson.meta.page_total;
        for (var shipId in data) {
            allShip[shipId] = data[shipId];
        }
    } while (pageNo != pageTotal);
    return allShip;
}

const fetchGameVerision = (baseUrl) => {
    return new Promise((resolve, reject) => {
        rp({
            url: baseUrl + '/internal_api' + EntryPoint.Internal.VERSION
        }).then((body) => {
            const data = JSON.parse(body).data;
            resolve(data.game_version);
        }).catch((error) => {
            logger.error(error);
            reject();
        });
    })
}

const fetchShipTierByPage = (baseUrl, pageNo) => {
    return new Promise((resolve, reject) => {
        rp({
            url: baseUrl + '/internal_api' + EntryPoint.Internal.SHIP_TIER.INFO,
            qs: {
                page_no: pageNo
            }
        }).then((body) => {
            resolve(body);
        }).catch((error) => {
            logger.error(error);
            reject();
        });
    });
}

const extractPlayers = (json) => {
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

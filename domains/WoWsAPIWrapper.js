const Env = require('./Env');
const Config = require('./Config');
const Util = require('./Util');

const fs = require('fs');
const _ = require('lodash');
const rp = require('request-promise');
const async = require('async');
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

class WoWsAPIWrapper {
    /**
     * 
     * @param {Object} tempAreaInfo tempArenaInfoの連想配列
     */
    constructor (tempAreaInfo, parallelRequestLimit = 5) {
        this.tempArenaInfo = tempAreaInfo;
        this.parallelRequestLimit = parallelRequestLimit;
    }

    /**
     * @returns {Array} [players, error]
     */
    async fetchPlayers () {
        const players = this._pickPlayerInfo();

        const commaSeparatedPlayerName = this._generateCommaSeparatedPlayerName(players);
        
        // アカウントIDの取得
        {
            const data = await this._fetchAccountId(commaSeparatedPlayerName).catch((error) => {
                throw new Error(error);
            });
            
            for (var playerInData of data) {
                players[playerInData.nickname].account_id = playerInData.account_id;
            }
            for (var name in players) {
                if (players[name].account_id === undefined) {
                    players[name].account_id = null;
                }
            }
        }
        
        const commaSeparatedAccountID = this._generateCommaSeparatedAccountID(players);
        
        // 個人データの取得
        {
            const data = await this._fetchPersonalData(commaSeparatedAccountID).catch((error) => {
                throw new Error(error);
            });

            for (var name in players) {
                const account_id = players[name].account_id;
                players[name].personal_data = _.get(data, '[' + account_id + ']', null);
            }
        }

        // 艦ごとの成績の取得
        {
            const data = await this._fetchShipStatistics(players).catch((error) => {
                throw new Error(error);
            });

            for (let name in players) {
                const account_id = players[name].account_id;
                players[name].ship_statistics = _.get(data, account_id, null);
            }
        }
        
        // クランIDの取得
        {
            const data = await this._fetchClanId(commaSeparatedAccountID).catch((error) => {
                throw new Error(error);
            });

            for (var name in players) {
                const account_id = players[name].account_id;
                const clan_id = _.get(data, '[' + account_id + '].clan_id', null);
                if (clan_id !== null) {
                    players[name].clan = {};
                    players[name].clan.clan_id = data[account_id].clan_id;
                } else {
                    players[name].clan = null;
                }
            }
        }

        const commaSeparatedClanID = this._generateCommaSeparatedClanID(players);

        // クランタグの取得
        {
            const data = await this._fetchClanTag(commaSeparatedClanID).catch((error) => {
                throw new Error(error);
            });
            
            for (var name in players) {
                const clan_id = _.get(players, '[' + name + '].clan.clan_id', null);
                if (clan_id !== null) {
                    players[name].clan.tag = _.get(data, '[' + clan_id + '].tag', null);
                }
            }
        }

        return players;
    }

    /**
     * @returns {Array} [allShips, error]
     */
    async fetchAllShips () {
        const currentGameVersion = await this._fetchGameVersion().catch((error) => {
            throw new Error(error);
        });
        const filePath = '.ships_' + currentGameVersion + '.json'
        const isExist = Util.checkFile(filePath);

        if (!isExist) {
            const [allShips, error] = await this._fetchAllShips();
            if (error !== null) {
                throw new Error(error);
            }
            
            fs.writeFileSync(filePath, JSON.stringify(allShips), 'utf8');
            return allShips;
        }

        const contents = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(contents);
    }

    /**
     * tempArenaInfo.jsonからプレイヤー情報を抽出する
     * 
     * @returns {Object} プレイヤー名をキー、shipID、敵味方情報とCPU情報を値とした連想配列
     */
    _pickPlayerInfo () {
        const players = {};
        const vehicles = this.tempArenaInfo.vehicles;

        for (var player of vehicles) {
            const name = player.name;
            const id = player.id;
            players[name] = {
                ship_id:    player.shipId,
                relation:  player.relation,
                is_player: this._isPlayer(name, id),
            };
        }

        return players;
    }

    /**
     * プレイヤーかCPUかを判別する
     * 
     * @param {string} name tempArenaInfoに記載されているname
     * @param {string} id tempArenaInfoに記載されているid
     */
    _isPlayer (name, id) {
        if (name.startsWith(':') && name.endsWith(':')) {
            return false;
        }

        if (id < 0) {
            return false;
        }

        return true;
    }

    /**
     * @param {Object} players
     * @returns {Array} カンマ区切りの実際のプレイヤー名
     */
    _generateCommaSeparatedPlayerName (players) {
        const exactPlayerNames = [];
        for (var name in players) {
            if (players[name].is_player) {
                exactPlayerNames.push(name)
            }
        }

        return exactPlayerNames.join(',');
    }

    /**
     * @param {Object} players
     * @returns {Array} カンマ区切りの実際のプレイヤーID
     */
    _generateCommaSeparatedAccountID (players) {
        const exactPlayerIDs = [];
        for (var name in players) {
            if (players[name].is_player) {
                exactPlayerIDs.push(players[name].account_id);
            }
        }

        return exactPlayerIDs.join(',');
    }

    /**
     * @param {Object} players
     * @returns {Array} カンマ区切りの実際のプレイヤーが所属するクランのID
     */
    _generateCommaSeparatedClanID (players) {
        const exactClanIDs = [];
        for (var name in players) {
            if (players[name].is_player) {
                exactClanIDs.push(_.get(players, '[' + name + '].clan.clan_id', null));
            }
        }

        return exactClanIDs.join(',');
    }

    /**
     * @param {string} commaSeparatedPlayerName カンマ区切りの実際のプレイヤー名 
     */
    _fetchAccountId (commaSeparatedPlayerName) {
        return new Promise((resolve, reject) => {
            rp({
                url: Util.generateApiUrl('/account/list/'),
                qs: {
                    application_id: Env.appid,
                    search: commaSeparatedPlayerName,
                    type: "exact",
                }
            }).then((body) => {
                resolve(JSON.parse(body).data);
            }).catch((error) => {
                reject('_fetchPlayerId(): ' + error);
            })
        });
    }

    /**
     * @param {string} commaSeparatedPlayerID カンマ区切りの実際のプレイヤーID
     */
    _fetchPersonalData (commaSeparatedPlayerID) {
        return new Promise((resolve, reject) => {
            rp({
                url: Util.generateApiUrl('/account/info/'),
                qs: {
                    application_id: Env.appid,
                    account_id: commaSeparatedPlayerID,
                    fields: 'hidden_profile,statistics'
                }
            }).then((body) => {
                resolve(JSON.parse(body).data);
            }).catch((error) => {
                reject('_fetchPersonalData(): ' + error);
            })
        });
    }

    /**
     * @param {Object} players 
     */
    _fetchShipStatistics (players) {
        return new Promise((resolve, reject) => {
            let allData = {};
            async.mapValuesLimit(players, this.parallelRequestLimit, (value, key, next) => {
                // 各プレイヤーの使用艦艇の統計を並列で取得する
                const account_id = players[key].account_id;
                rp({
                    url: Util.generateApiUrl('/ships/stats/'),
                    qs: {
                        application_id: Env.appid,
                        account_id: account_id,
                        fields: 'pvp.frags,pvp.battles,pvp.survived_battles,pvp.damage_dealt,pvp.xp,pvp.wins,ship_id',
                    }
                }).then((body) => {
                    const data = JSON.parse(body).data;
                    allData[account_id] = _.get(data, '[' + account_id + ']', null);
                    next();
                }).catch((error) => {
                    // TODO 取得失敗した場合もnullになってしまう
                    allData[account_id] = null;
                    next();
                });
            }, (error) => {
                return error ? reject('_fetchShipStatistics(): ' + error) : resolve(allData);
            });
        });
    }

    /**
     * @param {string} commaSeparatedAccountID 
     */
    _fetchClanId (commaSeparatedAccountID) {
        return new Promise((resolve, reject) => {
            // プレイヤーIDからクラン名を取得する
            rp({
                url: Util.generateApiUrl('/clans/accountinfo/'),
                qs: {
                    application_id: Env.appid,
                    account_id: commaSeparatedAccountID,
                    fields: 'clan_id',
                }
            }).then((body) => {
                resolve(JSON.parse(body).data);
            }).catch((error) => {
                reject('_fetchClanId(): ' + error);
            });
        });
    }

    /**
     * @param {string} commaSeparatedClanID 
     */
    _fetchClanTag(commaSeparatedClanID) {
        return new Promise((resolve, reject) => {
            // プレイヤーIDからクラン名を取得する
            rp({
                url: Util.generateApiUrl('/clans/info/'),
                qs: {
                    application_id: Env.appid,
                    clan_id: commaSeparatedClanID,
                    fields: 'tag'
                }
            }).then((body) => {
                resolve(JSON.parse(body).data);
            }).catch((error) => {
                reject('_fetchClanTag(): ' + error);
            });
        });
    }

    _fetchGameVersion () {
        return new Promise((resolve, reject) => {
            rp({
                url: Util.generateApiUrl('/encyclopedia/info/'),
                qs: {
                    application_id: Env.appid,
                    fields: "game_version",
                    language: "ja"
                }
            }).then((body) => {
                const data = JSON.parse(body).data;
                resolve(data.game_version);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    async _fetchAllShips () {
        let allShips = {};
        let pageNo = 0;
        let pageTotal = 0;

        do {
            // TODO エラーハンドリング
            const newJson = await this._fetchAllShipsByPage(++pageNo).catch((error) => {
                return [null, error];
            });
            const data = newJson.data
            pageTotal = newJson.meta.page_total;
            for (let ship_id in data) {
                allShips[ship_id] = data[ship_id];
            }
        } while (pageNo != pageTotal);

        return [allShips, error];
    }

    _fetchAllShipsByPage (pageNo) {
        return new Promise((resolve, reject) => {
            rp({
                url: Util.generateApiUrl('/encyclopedia/ships/'),
                qs: {
                    application_id: Env.appid,
                    fields: "name,tier,type,nation,default_profile.concealment.detect_distance_by_ship",
                    page_no: pageNo
                }
            }).then((body) => {
                resolve(JSON.parse(body));
            }).catch((error) => {
                reject('_fetchAllShipsByPage(): ' + error);
            });
        });
    }
}

module.exports = WoWsAPIWrapper;
const Env = require('./Env');
const Config = require('./Config');
const Util = require('./Util');
const Response = require('./Response');

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
     * @param {number} parallelRequestLimit 艦ごとの成績を取得するときの最大並列リクエスト数
     */
    constructor (tempAreaInfo, parallelRequestLimit = 5) {
        this.tempArenaInfo = tempAreaInfo;
        this.parallelRequestLimit = parallelRequestLimit;
    }

    /**
     * @returns {Array} [players, error]
     * @throws {Error}
     */
    async fetchPlayers () {
        const players = this._pickPlayerInfo();

        // アカウントIDの取得
        const commaSeparatedPlayerName = this._generateCommaSeparatedPlayerName(players);
        const accountIDs = await this._fetchAccountId(commaSeparatedPlayerName);
        this._addAccountID(players, accountIDs);
        
        // 個人データの取得
        const commaSeparatedAccountID = this._generateCommaSeparatedAccountID(players);
        const personalData = await this._fetchPersonalData(commaSeparatedAccountID);
        this._addPersonalData(players, personalData);

        // 艦ごとの成績の取得
        const shipStatistics = await this._fetchShipStatistics(players);
        this._addShipStatistics(players, shipStatistics);
        
        // クランIDの取得
        const ClanIDs = await this._fetchClanId(commaSeparatedAccountID);
        this._addClanID(players, ClanIDs);

        // クランタグの取得
        const commaSeparatedClanID = this._generateCommaSeparatedClanID(players);
        const clanTags = await this._fetchClanTag(commaSeparatedClanID);
        this._addClanTag(players, clanTags);

        return players;
    }

    /**
     * @returns {Array} [allShips, error]
     * @throws {Error}
     */
    async fetchAllShipsIfNeeded () {
        const currentGameVersion = await this._fetchGameVersion();

        const cachedFileName = '.ships_' + currentGameVersion + '.json';
        if (fs.existsSync(cachedFileName)) {
            const contents = fs.readFileSync(cachedFileName, 'utf8');
            return JSON.parse(contents);
        }

        const allShips = await this._fetchAllShipsInfo();
        fs.writeFileSync(cachedFileName, JSON.stringify(allShips), 'utf8');

        return allShips;
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
     * @returns {Array} 実際のプレイヤー名のカンマ区切り文字列
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
     * @returns {Array} 実際のプレイヤーIDのカンマ区切り文字列
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
     * @returns {Array} 実際のプレイヤーが所属するクランのIDのカンマ区切り文字列
     */
    _generateCommaSeparatedClanID (players) {
        const exactClanIDs = [];

        for (var name in players) {
            if (players[name].is_player) {
                const clanID = _.get(players, '[' + name + '].clan.clan_id', null);
                if (clanID !== null) {
                    exactClanIDs.push(clanID);
                }
            }
        }
        return exactClanIDs.join(',');
    }

    /**
     * アカウントIDを取得する
     * 
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
                throw new Error(Response.fetch_account_id_error);
            })
        });
    }

    /**
     * 個人データを取得する
     * 
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
                throw new Error(Response.fetch_personal_data_error);
            })
        });
    }

    /**
     * 各プレイヤーの使用艦艇の統計を並列で取得する
     * 
     * @param {Object} players 
     */
    _fetchShipStatistics (players) {
        return new Promise((resolve, reject) => {
            let allData = {};
            async.mapValuesLimit(players, this.parallelRequestLimit, (value, playerName, next) => {
                const account_id = players[playerName].account_id;
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
                    logger.error(`Failed to fetch statistics of ships the player have used from WoWs API: ${playerName}`);
                    allData[account_id] = null;
                    next();
                });
            }, (error) => {
                if (error !== null) {
                    throw new Error(Response.fetch_ship_statistics_error);
                }
                return resolve(allData);
            });
        });
    }

    /**
     * プレイヤーのクランIDを取得する
     * 
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
                throw new Error(Response.fetch_clan_id_error);
            });
        });
    }

    /**
     * プレイヤーのクランタグを取得する
     * 
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
                    fields: 'tag',
                }
            }).then((body) => {
                resolve(JSON.parse(body).data);
            }).catch((error) => {
                throw new Error(Response.fetch_clan_tag_error);
            });
        });
    }

    /**
     * players内の該当プレイヤーにアカウントIDを紐づける
     * 
     * @param {Object} players 
     * @param {Object} data 
     */
    _addAccountID (players, data) {
        for (var playerInData of data) {
            players[playerInData.nickname].account_id = playerInData.account_id;
        }
        for (var name in players) {
            if (players[name].account_id === undefined) {
                players[name].account_id = null;
            }
        }
    }

    /**
     * players内のプレイヤーに個人データを紐づける
     * 
     * @param {Object} players 
     * @param {Object} data 
     */
    _addPersonalData (players, data) {
        for (var name in players) {
            const account_id = players[name].account_id;
            players[name].personal_data = _.get(data, '[' + account_id + ']', null);
        }
    }

    /**
     * players内のプレイヤーに艦種ごとの成績を紐づける
     * 
     * @param {Object} players 
     * @param {Object} data 
     */
    _addShipStatistics (players, data) {
        for (let name in players) {
            const account_id = players[name].account_id;
            players[name].ship_statistics = _.get(data, account_id, null);
        }
    }

    /**
     * players内の該当プレイヤーにクランIDを紐づける
     * 
     * @param {Object} players 
     * @param {Object} data 
     */
    _addClanID (players, data) {
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

    /**
     * players内の該当プレイヤーにクランタグを紐づける
     * 
     * @param {Object} players 
     * @param {Object} data 
     */
    _addClanTag (players, data) {
        for (var name in players) {
            const clan_id = _.get(players, '[' + name + '].clan.clan_id', null);
            if (clan_id !== null) {
                players[name].clan.tag = _.get(data, '[' + clan_id + '].tag', null);
            }
        }
    }

    /**
     * 現在のゲームバージョンを取得する
     * 
     * @returns {string} バージョン名
     */
    _fetchGameVersion () {
        return new Promise((resolve, reject) => {
            rp({
                url: Util.generateApiUrl('/encyclopedia/info/'),
                qs: {
                    application_id: Env.appid,
                    fields: "game_version",
                    language: "ja",
                }
            }).then((body) => {
                const data = JSON.parse(body).data;
                resolve(data.game_version);
            }).catch((error) => {
                throw new Error(Response.fetch_game_version_error);
            });
        });
    }

    /**
     * すべての艦艇情報(艦名、ティア、艦種、国籍、隠蔽距離)を取得する
     * 
     * @returns {Object} 艦種情報
     */
    async _fetchAllShipsInfo () {
        const fetchAllShipsInfoByPage = (pageNo) => {
            return new Promise((resolve, reject) => {
                rp({
                    url: Util.generateApiUrl('/encyclopedia/ships/'),
                    qs: {
                        application_id: Env.appid,
                        fields: "name,tier,type,nation,default_profile.concealment.detect_distance_by_ship",
                        page_no: pageNo,
                    }
                }).then((body) => {
                    resolve(JSON.parse(body));
                }).catch((error) => {
                    throw new Error(Response.fetch_all_ships_info_error);
                });
            });
        };

        let allShips = {};
        let pageNo = 0;
        let pageTotal = 0;

        do {
            const json = await fetchAllShipsInfoByPage(++pageNo);
            pageTotal = json.meta.page_total;

            const data = json.data;
            for (let ship_id in data) {
                allShips[ship_id] = data[ship_id];
            }
        } while (pageNo !== pageTotal);

        return allShips;
    }
}

module.exports = WoWsAPIWrapper;

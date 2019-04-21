const WoWsAPIConfig = require('./WoWsAPIConfig')
const WoWsAPIClient = require('./WoWsAPIClient')

const fs = require('fs')
const _ = require('lodash')
const rp = require('request-promise')
const async = require('async')

class WoWsAPIWrapper {
  /**
   * コンストラクタ
   *
   * @param {Object} tempAreaInfo tempArenaInfoの連想配列
   * @param {Number} parallelRequestLimit 艦ごとの成績を取得するときの最大並列リクエスト数
   */
  constructor (tempAreaInfo, parallelRequestLimit = 5) {
    this.tempArenaInfo = tempAreaInfo
    this.parallelRequestLimit = parallelRequestLimit
  }

  /**
   * 表示するのに必要なデータをフェッチする
   *
   * @returns {Array} [players, error]
   * @throws {Error}
   */
  async fetchPlayers () {
    const players = this._pickPlayerInfo()

    // アカウントIDの取得
    const commaSeparatedPlayerName = this._generateCommaSeparatedPlayerName(players)
    const accountIDs = await this._fetchAccountId(commaSeparatedPlayerName)
    this._addAccountID(players, accountIDs)

    // 個人データの取得
    const commaSeparatedAccountID = this._generateCommaSeparatedAccountID(players)
    const personalData = await this._fetchPersonalData(commaSeparatedAccountID)
    this._addPersonalData(players, personalData)

    // 艦ごとの成績の取得
    const shipStatistics = await this._fetchShipStatistics(players)
    this._addShipStatistics(players, shipStatistics)

    // クランIDの取得
    const ClanIDs = await this._fetchClanId(commaSeparatedAccountID)
    this._addClanID(players, ClanIDs)

    // クランタグの取得
    const commaSeparatedClanID = this._generateCommaSeparatedClanID(players)
    const clanTags = await this._fetchClanTag(commaSeparatedClanID)
    this._addClanTag(players, clanTags)

    return players
  }

  /**
   * 全艦データを取得する。キャッシュがあればキャッシュを返却する
   *
   * @returns {Array} [allShips, error]
   * @throws {Error}
   */
  async fetchAllShipsIfNeeded () {
    const currentGameVersion = await this._fetchGameVersion()
    const latestCacheName = '.ships_' + currentGameVersion + '.json'

    // 古いバージョンのキャッシュを削除する
    var cacheNames = fs.readdirSync('./').filter(fileName => fileName.startsWith('.ships_'))
    for (const cacheName of cacheNames) {
      if (cacheName !== latestCacheName) {
        fs.unlinkSync(cacheName)
      }
    }

    // 最新のバージョンのキャッシュがあればそれを返却
    if (fs.existsSync(latestCacheName)) {
      const contents = fs.readFileSync(latestCacheName, 'utf8')
      return JSON.parse(contents)
    }

    // 最新のバージョンのキャッシュがなければフェッチして作成する
    const allShips = await this._fetchAllShipsInfo()
    fs.writeFileSync(latestCacheName, JSON.stringify(allShips), 'utf8')

    return allShips
  }

  /**
   * tempArenaInfo.jsonからプレイヤー情報を抽出する
   *
   * @returns {Object} プレイヤー名をキー、shipID、敵味方情報とCPU情報を値とした連想配列
   */
  _pickPlayerInfo () {
    const players = {}
    const vehicles = this.tempArenaInfo.vehicles

    for (let player of vehicles) {
      const name = player.name
      const id = player.id
      players[name] = {
        ship_id: player.shipId,
        relation: player.relation,
        is_player: this._isPlayer(name, id)
      }
    }
    return players
  }

  /**
   * プレイヤーかCPUかを判別する
   *
   * @param {String} name tempArenaInfoに記載されているname
   * @param {String} id tempArenaInfoに記載されているid
   * @returns {Boolean} プレイヤーならtrue
   */
  _isPlayer (name, id) {
    if (name.startsWith(':') && name.endsWith(':')) {
      return false
    }
    if (parseInt(id) < 0) {
      return false
    }
    return true
  }

  /**
   * カンマ区切りのプレイヤー名文字列を生成する
   *
   * @param {Object} players
   * @returns {Array} 実際のプレイヤー名のカンマ区切り文字列
   */
  _generateCommaSeparatedPlayerName (players) {
    const exactPlayerNames = []

    for (let name in players) {
      if (players[name].is_player) {
        exactPlayerNames.push(name)
      }
    }
    return exactPlayerNames.join(',')
  }

  /**
   * カンマ区切りのアカウントID文字列を生成する
   *
   * @param {Object} players
   * @returns {Array} 実際のプレイヤーIDのカンマ区切り文字列
   */
  _generateCommaSeparatedAccountID (players) {
    const exactAccountIDs = []

    for (let name in players) {
      if (players[name].is_player) {
        exactAccountIDs.push(players[name].account_id)
      }
    }
    return exactAccountIDs.join(',')
  }

  /**
   * カンマ区切りのクランID文字列を生成する
   *
   * @param {Object} players
   * @returns {Array} 実際のプレイヤーが所属するクランのIDのカンマ区切り文字列
   */
  _generateCommaSeparatedClanID (players) {
    const exactClanIDs = []

    for (let name in players) {
      if (players[name].is_player) {
        const clanID = _.get(players, '[' + name + '].clan.clan_id', null)
        if (clanID !== null) {
          exactClanIDs.push(clanID)
        }
      }
    }
    return exactClanIDs.join(',')
  }

  /**
   * アカウントIDを取得する
   *
   * @param {String} commaSeparatedPlayerName カンマ区切りの実際のプレイヤー名
   * @returns {Array} レスポンス内のdata
   */
  async _fetchAccountId (commaSeparatedPlayerName) {
    let wowsConfig = WoWsAPIConfig.fetch_account_id
    wowsConfig.qs.search = commaSeparatedPlayerName
    const json = await WoWsAPIClient.request(wowsConfig)
    return json.data
  }

  /**
   * 個人データを取得する
   *
   * @param {String} commaSeparatedAccountID カンマ区切りの実際のプレイヤーID
   * @returns {Array} レスポンス内のdata
   */
  async _fetchPersonalData (commaSeparatedAccountID) {
    let wowsConfig = WoWsAPIConfig.fetch_personal_data
    wowsConfig.qs.account_id = commaSeparatedAccountID
    const json = await WoWsAPIClient.request(wowsConfig)
    return json.data
  }

  /**
   * 各プレイヤーの使用艦艇の統計を並列で取得する
   *
   * @param {Object} players
   * @returns {Array} レスポンス内のdata
   */
  _fetchShipStatistics (players) {
    return new Promise((resolve, reject) => {
      let wowsConfig = WoWsAPIConfig.fetch_ship_statistics
      let allData = {}
      async.mapValuesLimit(players, this.parallelRequestLimit, (value, playerName, next) => {
        const accountID = players[playerName].account_id
        wowsConfig.qs.account_id = accountID
        rp({
          url: wowsConfig.url,
          qs: wowsConfig.qs
        }).then((body) => {
          const data = JSON.parse(body).data
          allData[accountID] = _.get(data, '[' + accountID + ']', null)
          next()
          return null
        }).catch(() => {
          logger.error(`Failed to fetch statistics of ships the player have used from WoWs API: ${playerName}`)
          allData[accountID] = null
          next()
          return null
        })
      }, (error) => {
        if (error !== null) {
          throw new Error(wowsConfig.error)
        }
        return resolve(allData)
      })
    })
  }

  /**
   * プレイヤーのクランIDを取得する
   *
   * @param {String} commaSeparatedAccountID
   * @returns {Array} レスポンス内のdata
   */
  async _fetchClanId (commaSeparatedAccountID) {
    let wowsConfig = WoWsAPIConfig.fetch_clan_id
    wowsConfig.qs.account_id = commaSeparatedAccountID
    const json = await WoWsAPIClient.request(wowsConfig)
    return json.data
  }

  /**
   * プレイヤーのクランタグを取得する
   *
   * @param {String} commaSeparatedClanID
   * @returns {Array} レスポンス内のdata
   */
  async _fetchClanTag (commaSeparatedClanID) {
    let wowsConfig = WoWsAPIConfig.fetch_clan_tag
    wowsConfig.qs.clan_id = commaSeparatedClanID
    const json = await WoWsAPIClient.request(wowsConfig)
    return json.data
  }

  /**
   * players内の該当プレイヤーにアカウントIDを紐づける
   *
   * @param {Object} players
   * @param {Object} data
   */
  _addAccountID (players, data) {
    for (let playerInData of data) {
      players[playerInData.nickname].account_id = playerInData.account_id
    }
    for (let name in players) {
      if (players[name].account_id === undefined) {
        players[name].account_id = null
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
    for (let name in players) {
      const accountID = players[name].account_id
      players[name].personal_data = _.get(data, '[' + accountID + ']', null)
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
      const accountID = players[name].account_id
      players[name].ship_statistics = _.get(data, accountID, null)
    }
  }

  /**
   * players内の該当プレイヤーにクランIDを紐づける
   *
   * @param {Object} players
   * @param {Object} data
   */
  _addClanID (players, data) {
    for (let name in players) {
      const accountID = players[name].account_id
      const clanID = _.get(data, '[' + accountID + '].clan_id', null)
      if (clanID !== null) {
        players[name].clan = {}
        players[name].clan.clan_id = data[accountID].clan_id
      } else {
        players[name].clan = null
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
    for (let name in players) {
      const clanID = _.get(players, '[' + name + '].clan.clan_id', null)
      if (clanID !== null) {
        players[name].clan.tag = _.get(data, '[' + clanID + '].tag', null)
      }
    }
  }

  /**
   * 現在のゲームバージョンを取得する
   *
   * @returns {String} バージョン名
   */
  async _fetchGameVersion () {
    let wowsConfig = WoWsAPIConfig.fetch_game_version
    const json = await WoWsAPIClient.request(wowsConfig)
    return json.data.game_version
  }

  /**
   * すべての艦艇情報(艦名、ティア、艦種、国籍、隠蔽距離)を取得する
   *
   * @returns {Object} 艦種情報
   */
  async _fetchAllShipsInfo () {
    const fetchAllShipsInfoByPage = async (pageNo) => {
      let wowsConfig = WoWsAPIConfig.fetch_all_ships_info
      wowsConfig.qs.page_no = pageNo
      const json = await WoWsAPIClient.request(wowsConfig)
      return json
    }

    let allShips = {}
    let pageNo = 0
    let pageTotal = 0

    do {
      const json = await fetchAllShipsInfoByPage(++pageNo)
      pageTotal = json.meta.page_total
      const data = json.data
      for (let shipID in data) {
        allShips[shipID] = data[shipID]
      }
    } while (pageNo !== pageTotal)

    return allShips
  }
}

module.exports = WoWsAPIWrapper

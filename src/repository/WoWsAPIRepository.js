'use strict'

const _ = require('lodash')

class WoWsAPIRepository {
  /**
   * コンストラクタ
   *
   * @param {Object} tempArenaInfo tempArenaInfoの連想配列
   * @param {Number} parallelRequestLimit 艦ごとの成績を取得するときの最大並列リクエスト数
   */
  constructor (wowsFileRepository, wowsAPIClient) {
    this.wowsFileRepository = wowsFileRepository
    this.wowsAPIClient = wowsAPIClient

    this.tempArenaInfo = null
    this.parallelRequestLimit = 5
  }

  /**
   * 表示するのに必要なデータをフェッチする
   *
   * @returns {Array} [players, error]
   * @throws {Error}
   */
  async fetchPlayers () {
    const players = pickPlayerInfo(this.tempArenaInfo)

    // アカウントIDの取得
    const joinedPlayerName = _.chain(players)
      .pickBy(player => { return player.is_player })
      .keys()
      .join(',')
      .value()
    const accountIds = await this.wowsAPIClient.fetchAccountId(joinedPlayerName)
    addAccountId(players, accountIds)

    const joinedAccountId = _.chain(players)
      .pickBy(player => { return player.is_player })
      .pickBy(player => { return _.isNumber(player.account_id) })
      .map(player => { return player.account_id })
      .join(',')
      .value()

    const fetchPersonalScore = new Promise((resolve, reject) => {
      // 個人データの取得
      this.wowsAPIClient.fetchPersonalScore(joinedAccountId).then(personalScore => {
        addPersonalScore(players, personalScore)
        resolve()
      })
    })

    const fetchShipScore = new Promise((resolve, reject) => {
      // 艦ごとの成績の取得
      this.wowsAPIClient.fetchShipScore(accountIds.map(value => value.account_id), this.parallelRequestLimit).then(shipScore => {
        addShipScore(players, shipScore)
        resolve()
      })
    })

    const fetchClan = new Promise((resolve, reject) => {
      // クランIDの取得
      this.wowsAPIClient.fetchClanId(joinedAccountId).then(clanIds => {
        addClanId(players, clanIds)
      }).then(() => {
        // クランタグの取得
        const joinedClanId = _.chain(players)
          .pickBy(player => { return player.is_player })
          .map(player => { return _.get(player, 'clan.clan_id', null) })
          .filter(clanId => { return _.isNumber(clanId) })
          .join(',')
          .value()
        return this.wowsAPIClient.fetchClanTag(joinedClanId)
      }).then(clanTags => {
        addClanTag(players, clanTags)
        resolve()
      })
    })

    return Promise.all([fetchPersonalScore, fetchShipScore, fetchClan]).then(() => {
      return players
    })
  }

  /**
   * 全艦データを取得する。キャッシュがあればキャッシュを返却する
   *
   * @returns {Array} [allShips, error]
   * @throws {Error}
   */
  async fetchAllShips () {
    const currentGameVersion = await this.wowsAPIClient.fetchGameVersion()

    this.wowsFileRepository.deleteOldShipCache(currentGameVersion)

    const cache = this.wowsFileRepository.readShipCache(currentGameVersion)
    if (cache !== null) {
      return JSON.parse(cache)
    }

    // 最新のバージョンのキャッシュがなければフェッチして作成する
    const allShips = await this.wowsAPIClient.fetchAllShipsInfo()
    this.wowsFileRepository.createShipCache(currentGameVersion, allShips)

    return allShips
  }
}

/**
 * tempArenaInfo.jsonからプレイヤー情報を抽出する
 *
 * @returns {Object} プレイヤー名をキー、shipID、敵味方情報とCPU情報を値とした連想配列
 * @throws {Error}
 */
const pickPlayerInfo = (tempArenaInfo) => {
  const players = {}

  if (!_.isArray(tempArenaInfo.vehicles)) {
    // TODO エラーの詳細
    throw new Error('invalid_temp_arena_info')
  }

  const vehicles = tempArenaInfo.vehicles

  for (const player of vehicles) {
    if (_.isNil(player.name) || _.isNil(player.shipId) || _.isNil(player.relation) || _.isNil(player.id)) {
      continue
    }

    players[player.name] = {
      ship_id: player.shipId,
      relation: player.relation,
      is_player: isPlayer(player.name, player.id)
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
const isPlayer = (name, id) => {
  if (name.startsWith(':') && name.endsWith(':')) {
    return false
  }

  if (parseInt(id) < 0) {
    return false
  }

  return true
}

/**
 * players内の該当プレイヤーにアカウントIDを紐づける
 *
 * @param {Object} players
 * @param {Object} data
 */
const addAccountId = (players, data) => {
  for (const player of data) {
    players[player.nickname].account_id = player.account_id
  }
}

/**
 * players内のプレイヤーに個人データを紐づける
 *
 * @param {Object} players
 * @param {Object} data
 */
const addPersonalScore = (players, data) => {
  for (const playerName in players) {
    const accountId = players[playerName].account_id
    players[playerName].personal_data = _.get(data, '[' + accountId + ']', null)
  }
}

/**
 * players内のプレイヤーに艦種ごとの成績を紐づける
 *
 * @param {Object} players
 * @param {Object} data
 */
const addShipScore = (players, data) => {
  for (const playerName in players) {
    const accountId = players[playerName].account_id
    players[playerName].ship_statistics = _.get(data, accountId, null)
  }
}

/**
 * players内の該当プレイヤーにクランIDを紐づける
 *
 * @param {Object} players
 * @param {Object} data
 */
const addClanId = (players, data) => {
  for (const playerName in players) {
    const accountId = players[playerName].account_id
    const clanId = _.get(data, '[' + accountId + '].clan_id', null)
    if (clanId !== null) {
      players[playerName].clan = {}
      players[playerName].clan.clan_id = clanId
    } else {
      players[playerName].clan = null
    }
  }
}

/**
 * players内の該当プレイヤーにクランタグを紐づける
 *
 * @param {Object} players
 * @param {Object} data
 */
const addClanTag = (players, data) => {
  for (const playerName in players) {
    const clanId = _.get(players, '[' + playerName + '].clan.clan_id', null)
    if (clanId !== null) {
      players[playerName].clan.tag = _.get(data, '[' + clanId + '].tag', null)
    }
  }
}

module.exports = WoWsAPIRepository

'use strict'

const _ = require('lodash')
const logger = require('log4js').getLogger()

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
    const joinedPlayerName = joinPlayerName(players)
    const accountIds = await this.wowsAPIClient.fetchAccountId(joinedPlayerName)
    addAccountId(players, accountIds)

    const joinedAccountId = joinAccountId(players)

    const fetchPersonalScore = new Promise(async (resolve, reject) => {
      // 個人データの取得
      const personalScore = await this.wowsAPIClient.fetchPersonalScore(joinedAccountId)
      addPersonalScore(players, personalScore)
      resolve()
    })

    const fetchShipScore = new Promise(async (resolve, reject) => {
      // 艦ごとの成績の取得
      const shipScore = await this.wowsAPIClient.fetchShipScore(accountIds.map(value => value.account_id), this.parallelRequestLimit)
      addShipScore(players, shipScore)
      resolve()
    })

    const fetchClan = new Promise(async (resolve, reject) => {
      // クランIDの取得
      const clanIds = await this.wowsAPIClient.fetchClanId(joinedAccountId)
      addClanId(players, clanIds)

      // クランタグの取得
      const joinedClanId = joinClanId(players)
      const clanTags = await this.wowsAPIClient.fetchClanTag(joinedClanId)
      addClanTag(players, clanTags)
      resolve()
    })

    return await Promise.all([fetchPersonalScore, fetchShipScore, fetchClan]).then(() => {
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
 */
const pickPlayerInfo = (tempArenaInfo) => {
  const players = {}

  for (const player of tempArenaInfo.vehicles) {
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
 * カンマ区切りのプレイヤー名文字列を生成する
 *
 * @param {Object} players
 * @returns {Array} 実際のプレイヤー名のカンマ区切り文字列
 */
const joinPlayerName = (players) => {
  const playerNames = []

  for (const playerName in players) {
    if (players[playerName].is_player) {
      playerNames.push(playerName)
    }
  }

  return playerNames.join(',')
}

/**
 * カンマ区切りのアカウントID文字列を生成する
 *
 * @param {Object} players
 * @returns {Array} 実際のプレイヤーIDのカンマ区切り文字列
 */
const joinAccountId = (players) => {
  const accountIds = []

  for (const playerName in players) {
    if (players[playerName].is_player) {
      accountIds.push(players[playerName].account_id)
    }
  }

  return accountIds.join(',')
}

/**
 * カンマ区切りのクランID文字列を生成する
 *
 * @param {Object} players
 * @returns {Array} 実際のプレイヤーが所属するクランのIDのカンマ区切り文字列
 */
const joinClanId = (players) => {
  const clanIds = []

  for (const playerName in players) {
    if (!players[playerName].is_player) {
      continue
    }

    const clanId = _.get(players, '[' + playerName + '].clan.clan_id', null)
    if (clanId === null) {
      continue
    }

    clanIds.push(clanId)
  }

  return clanIds.join(',')
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

'use strict'

const _ = require('lodash')

class WoWsAPIRepository {
  /**
   * コンストラクタ
   *
   * @param {Object} tempArenaInfo tempArenaInfoの連想配列
   * @param {Number} parallelRequestLimit 艦ごとの成績を取得するときの最大並列リクエスト数
   */
  constructor (wowsFileRepository, wowsAPIClient, parallelRequestLimit = 5) {
    this.wowsFileRepository = wowsFileRepository
    this.wowsAPIClient = wowsAPIClient
    this.parallelRequestLimit = parallelRequestLimit
  }

  /**
   * 表示するのに必要なデータをフェッチする
   *
   * @param {Object} tempArenaInfo tempArenaInfo.json
   * @returns {Array} プレイヤー名をキーとするプレイヤー情報、艦情報、艦スコア、プレイヤースコアの連想配列
   * @throws {Error}
   */
  async fetchPlayers (tempArenaInfo) {
    var players = pickPlayerInfo(tempArenaInfo)

    // アカウントIDの取得
    const joinedPlayerName = _.chain(players)
      .pickBy(player => { return player.is_player })
      .keys()
      .join(',')
      .value()

    const accountIdResponseBody = await this.wowsAPIClient.fetchAccountId(joinedPlayerName)
    _.chain(accountIdResponseBody)
      .forEach(player => { players[player.nickname].account_id = player.account_id })
      .value()

    const joinedAccountId = _.chain(players)
      .pickBy(player => { return player.is_player })
      .pickBy(player => { return _.isNumber(player.account_id) })
      .map(player => { return player.account_id })
      .join(',')
      .value()

    var personalScoreResponseBody
    const personalScorePromise = new Promise(resolve => {
      // 個人データの取得
      this.wowsAPIClient.fetchPersonalScore(joinedAccountId).then(_personalScoreResponseBody => {
        personalScoreResponseBody = _personalScoreResponseBody
        resolve()
      })
    })

    var shipScoreResponseBody
    const shipScorePromise = new Promise(resolve => {
      // 艦ごとの成績の取得
      const accountIds = accountIdResponseBody.map(value => value.account_id)
      this.wowsAPIClient.fetchShipScore(accountIds, this.parallelRequestLimit).then(_shipScoreResponseBody => {
        shipScoreResponseBody = _shipScoreResponseBody
        resolve()
      })
    })

    var clanIdResponseBody
    var clanTagResponseBody
    const clanPromise = new Promise(resolve => {
      // クランIDの取得
      this.wowsAPIClient.fetchClanId(joinedAccountId).then(_clanIdResponseBody => {
        clanIdResponseBody = _clanIdResponseBody
      }).then(() => {
        // クランタグの取得
        const joinedClanId = _.chain(clanIdResponseBody)
          .map(player => { return _.get(player, 'clan_id', null) })
          .join(',')
          .value()
        return this.wowsAPIClient.fetchClanTag(joinedClanId)
      }).then(_clanTagResponseBody => {
        clanTagResponseBody = _clanTagResponseBody
        resolve()
      })
    })

    // 個人成績、艦別成績、クラン情報は並列で取得する
    return Promise.all([personalScorePromise, shipScorePromise, clanPromise]).then(() => {
      _.chain(players)
        .keys()
        .forEach(playerName => {
          const accountId = players[playerName].account_id
          players[playerName].personal_statistics = _.get(personalScoreResponseBody, accountId, null)
          players[playerName].ship_statistics = _.get(shipScoreResponseBody, accountId, null)

          players[playerName].clan = null
          const clanId = _.get(clanIdResponseBody, `${accountId}.clan_id`)
          const clanTag = _.get(clanTagResponseBody, `${clanId}.tag`)
          if (!_.isNil(clanId) && !_.isNil(clanTag)) {
            players[playerName].clan = {
              id: clanId,
              tag: clanTag
            }
          }
        })
        .value()
      return players
    })
  }

  /**
   * 全艦データを取得する。キャッシュがあればキャッシュを返却する
   *
   * @returns {Array}
   * @throws {Error}
   */
  async fetchAllShips (gameVersion) {
    const prefix = '.ships_'
    const cacheFileName = `${prefix}${gameVersion}.json`

    const cache = this.wowsFileRepository.readCache(cacheFileName)
    if (!_.isNull(cache)) {
      return JSON.parse(cache)
    }

    // 最新のバージョンのキャッシュがなければフェッチして作成する
    const allShips = await this.wowsAPIClient.fetchAllShipsInfo()

    this.wowsFileRepository.deleteCache(prefix)
    this.wowsFileRepository.createCache(cacheFileName, allShips)
    return allShips
  }

  /**
   * 現在のゲームバージョンを取得する
   *
   * @returns {String}
   */
  async fetchGameVersion () {
    const responseBody = await this.wowsAPIClient.fetchGameVersion()
    return responseBody.game_version
  }
}

/**
 * tempArenaInfo.jsonからプレイヤー情報を抽出する
 *
 * @returns {Object} プレイヤー名をキー、shipID、敵味方情報とCPU情報を値とした連想配列
 * @throws {Error}
 */
const pickPlayerInfo = (tempArenaInfo) => {
  const vehicles = _.get(tempArenaInfo, 'vehicles')

  if (_.isNil(vehicles)) {
    throw new Error('invalid tempArenaInfo.json')
  }

  const players = {}
  for (const player of vehicles) {
    if (_.isNil(player.name) || _.isNil(player.shipId) || _.isNil(player.relation) || _.isNil(player.id)) {
      continue
    }

    players[player.name] = {
      ship_id: player.shipId,
      relation: player.relation,
      is_player: !(player.name.startsWith(':') && player.name.endsWith(':')) && parseInt(player.id) >= 0
    }
  }

  return players
}

module.exports = WoWsAPIRepository

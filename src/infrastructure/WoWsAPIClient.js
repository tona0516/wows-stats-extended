'use strict'

const axios = require('axios')
const async = require('async')
const _ = require('lodash')

const Constant = require('../common/Constant')

const logger = require('log4js').getLogger()

/**
 * 共通リクエストメソッド
 *
 * @param {String} URL
 * @param {Dict} クエリパラメータ
 * @return {Dict} レスポンスボディ
 */
const get = async (url, params) => {
  try {
    const response = await axios.get(url, { params: params })
    return response.data
  } catch (error) {
    throw new Error(JSON.stringify({
      url: url,
      params: params,
      error: error
    }))
  }
}

/**
 * WOWS-APIのリクエストURLを生成する
 *
 * @param {String} path region以下のパス
 * @returns {String} WOWS-APIのURL
 */
const generateApiUrl = (path, topLevelDomain = process.env.REGION) => {
  return `${Constant.URL.WOWS_API}${topLevelDomain}/${Constant.PATH.WOWS_PATH}${path}`
}

class WoWsAPIClient {
  async fetchEncyclopediaInfo (appid, region) {
    const topLevelDomain = (region === 'NA') ? 'com' : region
    const url = generateApiUrl('/encyclopedia/info/', topLevelDomain)
    const body = await get(url, { application_id: appid })

    return body.data
  }

  async fetchAccountId (playerNamesString) {
    const url = generateApiUrl('/account/list/')
    const params = {
      application_id: process.env.APP_ID,
      search: playerNamesString,
      type: 'exact'
    }
    const body = await get(url, params)

    return body.data
  }

  async fetchPersonalScore (accountIdsString) {
    const url = generateApiUrl('/account/info/')
    const params = {
      application_id: process.env.APP_ID,
      account_id: accountIdsString,
      fields: 'hidden_profile,statistics'
    }
    const body = await get(url, params)

    return body.data
  }

  async fetchShipScore (accountIds, limit) {
    var players = {}

    await async.eachLimit(accountIds, limit, async accountId => {
      const url = generateApiUrl('/ships/stats/')
      const params = {
        application_id: process.env.APP_ID,
        fields: 'pvp.frags,pvp.battles,pvp.survived_battles,pvp.damage_dealt,pvp.xp,pvp.wins,ship_id',
        account_id: accountId
      }

      try {
        const response = await axios.get(url, { params: params })
        players[accountId] = _.get(response, `data.data.${accountId}`, null)
      } catch {
        logger.warning(`Failed to fetch statistics of ships the player have used from WoWs API. ID: ${accountId}`)
        players[accountId] = null
      }
    })

    return players
  }

  async fetchClanId (accountIdsString) {
    const url = generateApiUrl('/clans/accountinfo/')
    const params = {
      application_id: process.env.APP_ID,
      account_id: accountIdsString,
      fields: 'clan_id'
    }

    const body = await get(url, params)
    return body.data
  }

  async fetchClanTag (clanIdsString) {
    const url = generateApiUrl('/clans/info/')
    const params = {
      application_id: process.env.APP_ID,
      clan_id: clanIdsString,
      fields: 'tag'
    }

    const body = await get(url, params)
    return body.data
  }

  async fetchGameVersion () {
    const url = generateApiUrl('/encyclopedia/info/')
    const params = {
      application_id: process.env.APP_ID,
      fields: 'game_version',
      language: 'ja'
    }

    const body = await get(url, params)
    return body.data
  }

  async fetchAllShipsInfo () {
    const fetchAllShipsInfoByPage = async (pageNo) => {
      const url = generateApiUrl('/encyclopedia/ships/')
      const params = {
        application_id: process.env.APP_ID,
        fields: 'name,tier,type,nation,default_profile.concealment.detect_distance_by_ship',
        language: 'ja',
        page_no: pageNo
      }
      const body = await get(url, params)
      return body
    }

    const ships = {}
    let pageNo = 0
    let pageTotal = 0

    do {
      const json = await fetchAllShipsInfoByPage(++pageNo)
      pageTotal = json.meta.page_total
      const data = json.data
      for (const shipID in data) {
        ships[shipID] = data[shipID]
      }
    } while (pageNo !== pageTotal)

    return ships
  }
}

module.exports = WoWsAPIClient

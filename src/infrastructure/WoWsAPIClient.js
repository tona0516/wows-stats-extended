'use strict'

const rp = require('request-promise')
const async = require('async')
const _ = require('lodash')

const Constant = require('../common/Constant')

const logger = require('log4js').getLogger()

/**
 * 共通リクエストメソッド
 *
 * @param {Object} options request-processのoptions
 * @throws {Error} 
 */
const request = (options) => {
  return new Promise((resolve) => {
    rp(options)
    .then((body) => {
      resolve(body)
    }).catch((error) => {
      throw new Error(JSON.stringify({
        options: options,
        error: error
      }))
    })
  })
}

/**
 * WOWS-APIのリクエストURLを生成する
 *
 * @param {String} path region以下のパス
 * @returns {String} WOWS-APIのURL
 */
const generateApiUrl = (path) => {
  return Constant.URL.WOWS_API + process.env.REGION + '/' + Constant.PATH.WOWS_PATH + path
}

const fetchAllShipsInfoByPage = async (pageNo) => {
  const options = {
    url: generateApiUrl('/encyclopedia/ships/'),
    qs: {
      application_id: process.env.APP_ID,
      fields: 'name,tier,type,nation,default_profile.concealment.detect_distance_by_ship',
      language: 'ja',
      page_no: pageNo
    },
    json: true
  }

  const body = await request(options)
  return body
}

class WoWsAPIClient {
  async fetchEncyclopediaInfo (appid, region) {
    const topLevelDomain = (region === 'NA') ? 'com' : region
    const options = {
      url: Constant.URL.WOWS_API + topLevelDomain.toLowerCase() + '/' + Constant.PATH.WOWS_PATH + '/encyclopedia/info/',
      qs: {
        application_id: appid
      },
      json: true
    }

    const body = await request(options)
    return body.data
  }

  async fetchAccountId (playerNamesString) {
    const options = {
      url: generateApiUrl('/account/list/'),
      qs: {
        application_id: process.env.APP_ID,
        search: playerNamesString,
        type: 'exact'
      },
      json: true
    }

    const body = await request(options)
    return body.data
  }

  async fetchPersonalScore (accountIdsString) {
    const options = {
      url: generateApiUrl('/account/info/'),
      qs: {
        application_id: process.env.APP_ID,
        account_id: accountIdsString,
        fields: 'hidden_profile,statistics'
      },
      json: true
    }

    const body = await request(options)
    return body.data
  }

  async fetchShipScore (accountIds, limit) {
    return new Promise((resolve, reject) => {
      const options = {
        url: generateApiUrl('/ships/stats/'),
        qs: {
          application_id: process.env.APP_ID,
          fields: 'pvp.frags,pvp.battles,pvp.survived_battles,pvp.damage_dealt,pvp.xp,pvp.wins,ship_id'
        },
        json: true
      }
      const players = {}

      async.mapLimit(accountIds, limit, (accountId, next) => {
        options.qs.account_id = accountId

        rp(options)
        .then((body) => {
          players[accountId] = _.get(body.data, '[' + accountId + ']', null)
          next()
          return null
        }).catch((error) => {
          logger.warning(`Failed to fetch statistics of ships the player have used from WoWs API. ID: ${accountId}`)
          players[accountId] = null
          next()
        })
      }, (error) => {
        if (error !== null) {
          throw new Error(JSON.stringify({
            url: options.url,
            qs: options.qs,
            error: error
          }))
        }
        return resolve(players)
      })
    })
  }

  async fetchClanId (accountIdsString) {
    const options = {
      url: generateApiUrl('/clans/accountinfo/'),
      qs: {
        application_id: process.env.APP_ID,
        account_id: accountIdsString,
        fields: 'clan_id'
      },
      json: true
    }

    const body = await request(options)
    return body.data
  }

  async fetchClanTag (clanIdsString) {
    const options = {
      url: generateApiUrl('/clans/info/'),
      qs: {
        application_id: process.env.APP_ID,
        clan_id: clanIdsString,
        fields: 'tag'
      },
      json: true
    }

    const body = await request(options)
    return body.data
  }

  async fetchGameVersion () {
    const options = {
      url: generateApiUrl('/encyclopedia/info/'),
      qs: {
        application_id: process.env.APP_ID,
        fields: 'game_version',
        language: 'ja'
      },
      json: true
    }
    
    const body = await request(options)
    return body.data.game_version
  }

  async fetchAllShipsInfo () {
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

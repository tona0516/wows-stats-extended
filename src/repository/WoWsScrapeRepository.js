'use strict'

const axios = require('axios')
const _ = require('lodash')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

const Constant = require('../common/Constant')

class WoWsScrapeRepository {
  constructor (wowsFileRepository) {
    this.wowsFileRepository = wowsFileRepository
  }

  /**
   * 以下のサイトからレーダー距離の情報を取得する。
   * https://wiki.wargaming.net/en/Ship:Surveillance_Radar_Data
   *
   * @param {String} gameVersion ゲームバージョン
   * @param {Object} 艦名をキーとするレーダー距離の連想配列
   */
  async fetchRadarData (gameVersion) {
    const prefix = '.radars_'
    const cacheFileName = `${prefix}${gameVersion}.json`

    const cache = this.wowsFileRepository.readCache(cacheFileName)
    if (!_.isNull(cache)) {
      return JSON.parse(cache)
    }

    const radarData = await fetchRadarData()

    this.wowsFileRepository.deleteCache(prefix)
    this.wowsFileRepository.createCache(cacheFileName, radarData)

    return radarData
  }
}

const fetchRadarData = async () => {
  const response = await axios.get(Constant.URL.RADAR_DATA_URL)
  const dom = new JSDOM(response.data)
  const trs = dom.window.document.querySelectorAll('#mw-content-text > div > table > tbody > tr')

  var radarData = {}
  for (const tr of trs) {
    try {
      const shipNames = tr.children[1].textContent.trim().split(',')
      const range = parseFloat(tr.children[5].textContent.trim())

      if (_.isEmpty(shipNames) || _.isNaN(range)) {
        continue
      }

      for (const shipName of shipNames) {
        radarData[shipName] = range
      }
    } catch {
      continue
    }
  }

  return radarData
}

module.exports = WoWsScrapeRepository

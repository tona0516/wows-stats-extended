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

  async fetchRadarData (gameVersion) {
    const prefix = '.radars_'
    this.wowsFileRepository.deleteOldCache(prefix, gameVersion)

    const cache = this.wowsFileRepository.readCache(prefix, gameVersion)
    if (cache !== null) {
      return JSON.parse(cache)
    }

    var radarData = {}
    const response = await axios.get(Constant.URL.RADAR_DATA_URL)
    const dom = new JSDOM(response.data)
    const trs = dom.window.document.querySelectorAll('#mw-content-text > div > table > tbody > tr')
    for (const tr of trs) {
      if (!_.isNil(tr.children[1]) && !_.isNil(tr.children[5])) {
        const shipNames = tr.children[1].textContent.trim().split(',')
        const range = parseFloat(tr.children[5].textContent.trim())
        if (!_.isNaN(range)) {
          for (const shipName of shipNames) {
            radarData[shipName] = range
          }
        }
      }
    }

    this.wowsFileRepository.createCache(radarData, prefix, gameVersion)

    return radarData
  }
}

module.exports = WoWsScrapeRepository

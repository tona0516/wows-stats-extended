'use strict'

const logger = require('log4js').getLogger()

class FetchManager {
  constructor (wowsAPIRepository, wowsDataShaper, wowsScrapeRepository) {
    this.wowsAPIRepository = wowsAPIRepository
    this.wowsDataShaper = wowsDataShaper
    this.wowsScrapeRepository = wowsScrapeRepository
  }

  async fetch (tempArenaInfo) {
    const startTime = new Date()

    this.wowsAPIRepository.tempArenaInfo = tempArenaInfo

    const gameVersion = await this.wowsAPIRepository.fetchGameVersion()

    const fetchPlayersPromise = this.wowsAPIRepository.fetchPlayers()
    const fetchAllShipsPromise = this.wowsAPIRepository.fetchAllShips(gameVersion)
    const fetchRadarDataPromise = this.wowsScrapeRepository.fetchRadarData(gameVersion)

    const result = await Promise.all([fetchPlayersPromise, fetchAllShipsPromise, fetchRadarDataPromise])
      .then(([players, allShips, radarData]) => {
        this.wowsDataShaper.players = players
        this.wowsDataShaper.allShips = allShips
        this.wowsDataShaper.radarData = radarData

        const shaped = this.wowsDataShaper.shape()

        const elapsedTime = (new Date().getTime() - startTime.getTime()) / 1000.0
        logger.info(`取得完了 処理時間: ${elapsedTime.toFixed(2)}秒`)

        return shaped
      }).catch((error) => {
        logger.error(error)
        return error
      })

    return result
  }
}

module.exports = FetchManager

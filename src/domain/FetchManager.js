'use strict'

const logger = require('log4js').getLogger()

class FetchManager {
  constructor (wowsAPIWrapper, wowsDataShaper) {
    this.wowsAPIWrapper = wowsAPIWrapper
    this.wowsDataShaper = wowsDataShaper
  }

  fetch (tempArenaInfo) {
    return new Promise((resolve, reject) => {
      logger.info('取得開始')
      const startTime = new Date()

      this.wowsAPIWrapper.tempArenaInfo = tempArenaInfo

      const fetchPlayersPromise = this.wowsAPIWrapper.fetchPlayers()
      const fetchAllShipsPromise = this.wowsAPIWrapper.fetchAllShips()

      Promise.all([fetchPlayersPromise, fetchAllShipsPromise])
      .then(([players, allShips]) => {
        this.wowsDataShaper.players = players
        this.wowsDataShaper.allShips = allShips

        const shaped = this.wowsDataShaper.shape()

        const elapsedTime = (new Date().getTime() - startTime.getTime()) / 1000.0
        logger.info(`取得完了 処理時間: ${elapsedTime.toFixed(2)}秒`)

        return resolve(shaped)
      }).catch((error) => {
        logger.error(error)
        return reject(error)
      })
    })
  }
}

module.exports = FetchManager

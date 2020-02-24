'use strict'

const fs = require('fs')

const Constant = require('../common/Constant')

class WoWsFileRepository {
  readTempArenaInfo () {
    const defaultFilePath = process.env.DIRECTORY + Constant.PATH.TEMP_ARENA_INFO_PATH
    if (fs.existsSync(defaultFilePath)) {
      return fs.readFileSync(defaultFilePath, 'utf8')
    }

    const bin64FilePath = process.env.DIRECTORY + 'bin64/' + Constant.PATH.TEMP_ARENA_INFO_PATH
    if (fs.existsSync(bin64FilePath)) {
      return fs.readFileSync(bin64FilePath, 'utf8')
    }

    return null
  }

  createDotEnv (contents) {
    const list = []
    for (const [key, value] of Object.entries(contents)) {
      list.push(key + '=' + value)
    }

    fs.writeFileSync('.env', list.join('\n'))
    require('dotenv').config()
  }

  createShipCache (currentGameVersion, data) {
    const latestCacheName = generateShipCacheName(currentGameVersion)
    fs.writeFileSync(latestCacheName, JSON.stringify(data), 'utf8')
  }

  readShipCache (currentGameVersion) {
    const latestCacheName = generateShipCacheName(currentGameVersion)

    try {
      return fs.readFileSync(latestCacheName, 'utf8')
    } catch (error) {
      return null
    }
  }

  deleteOldShipCache (currentGameVersion) {
    const latestCacheName = generateShipCacheName(currentGameVersion)

    // 古いバージョンのキャッシュを削除する
    fs.readdirSync('./')
      .filter(fileName => fileName.startsWith('.ships_') && fileName !== latestCacheName)
      .forEach(oldCache => fs.unlinkSync(oldCache))
  }
}

const generateShipCacheName = (gameVersion) => {
  return `.ships_${gameVersion}.json`
}

module.exports = WoWsFileRepository

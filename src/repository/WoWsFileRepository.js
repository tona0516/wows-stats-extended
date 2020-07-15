'use strict'

const fs = require('fs')

const Constant = require('../common/Constant')

const cacheName = (prefix, gameVersion) => {
  return `${prefix}${gameVersion}.json`
}

class WoWsFileRepository {
  /**
   * tempArenaInfo.jsonを読み込む。
   *
   * @return JSON文字列。存在しない場合はnull。
   */
  readTempArenaInfo () {
    const filePaths = [
      process.env.DIRECTORY + Constant.PATH.TEMP_ARENA_INFO_PATH,
      process.env.DIRECTORY + 'bin64/' + Constant.PATH.TEMP_ARENA_INFO_PATH
    ]

    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8')
      }
    }

    return null
  }

  /**
   * 環境変数を.envに書き込む。
   *
   * @param {Object} dict key-value形式のの環境変数
   */
  createDotEnv (dict) {
    const list = []
    for (const [key, value] of Object.entries(dict)) {
      list.push(key + '=' + value)
    }

    fs.writeFileSync('.env', list.join('\n'))

    require('dotenv').config()
  }

  /**
   * キャッシュを生成する。
   *
   * @param {String} gameVersion ゲームバージョン
   * @param {Object} data 保存するデータ
   */
  createCache (data, prefix, gameVersion) {
    fs.writeFileSync(cacheName(prefix, gameVersion), JSON.stringify(data), 'utf8')
  }

  /**
   * 艦艇情報のキャッシュを読み込む。
   *
   * @param {String} gameVersion ゲームバージョン
   * @returns {String} 艦艇情報のJSON文字列。存在しない場合はnull。
   */
  readCache (prefix, gameVersion) {
    const latestCacheName = cacheName(prefix, gameVersion)

    if (fs.existsSync(latestCacheName)) {
      return fs.readFileSync(latestCacheName, 'utf8')
    }

    return null
  }

  /**
   * 前のバージョンの艦艇情報のキャッシュを削除する。
   *
   * @param {String} gameVersion ゲームバージョン
   */
  deleteOldCache (prefix, gameVersion) {
    const latestCacheName = cacheName(prefix, gameVersion)

    // 古いバージョンのキャッシュを削除する
    fs.readdirSync('./')
      .filter(fileName => fileName.startsWith(prefix) && fileName !== latestCacheName)
      .forEach(oldCacheName => fs.unlinkSync(oldCacheName))
  }
}

module.exports = WoWsFileRepository

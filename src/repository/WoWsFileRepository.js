'use strict'

const fs = require('fs')

const Constant = require('../common/Constant')
const ENCODE = 'utf8'

class WoWsFileRepository {
  /**
   * tempArenaInfo.jsonを読み込む。
   *
   * @return {String} JSON文字列。存在しない場合はnull。
   */
  readTempArenaInfo () {
    const filePaths = [
      `${process.env.DIRECTORY}${Constant.PATH.TEMP_ARENA_INFO_PATH}`,
      `${process.env.DIRECTORY}bin64/${Constant.PATH.TEMP_ARENA_INFO_PATH}`
    ]

    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, ENCODE)
      }
    }

    return null
  }

  /**
   * 環境変数を.envに書き込む。
   *
   * @param {Object} data key-value形式の環境変数
   */
  createDotEnv (data) {
    var list = []
    for (const [key, value] of Object.entries(data)) {
      list.push(`${key}=${value}`)
    }

    fs.writeFileSync('.env', list.join('\n'))

    require('dotenv').config()
  }

  /**
   * キャッシュを生成する。
   *
   * @param {String} cacheFileName キャッシュファイル名
   * @param {Object} data 保存するデータ
   */
  createCache (cacheFileName, data) {
    fs.writeFileSync(cacheFileName, JSON.stringify(data), ENCODE)
  }

  /**
   * キャッシュを読み込む。
   *
   * @param {String} cacheFileName キャッシュファイル名
   * @returns {String} JSON文字列。存在しない場合はnull。
   */
  readCache (cacheFileName) {
    if (fs.existsSync(cacheFileName)) {
      return fs.readFileSync(cacheFileName, ENCODE)
    }

    return null
  }

  /**
   * 前のバージョンのキャッシュを削除する。
   *
   * @param {String} prefix キャッシュファイル名のプレフィックス
   */
  deleteCache (prefix) {
    // 古いバージョンのキャッシュを削除する
    fs.readdirSync('./')
      .filter(fileName => fileName.startsWith(prefix))
      .forEach(cacheFileName => fs.unlinkSync(cacheFileName))
  }
}

module.exports = WoWsFileRepository

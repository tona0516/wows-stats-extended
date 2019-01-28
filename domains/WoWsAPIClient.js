const rp = require('request-promise')

class WoWsAPIClient {
  /**
   * WOWS-APIリクエスト用
   *
   * @param {Object} wowsAPIConfig WoWsAPIConfigオブジェクト
   */
  static request (wowsAPIConfig) {
    return new Promise((resolve) => {
      rp({
        url: wowsAPIConfig.url,
        qs: wowsAPIConfig.qs
      }).then((body) => {
        resolve(JSON.parse(body))
      }).catch(() => {
        throw new Error(wowsAPIConfig.error)
      })
    })
  }
}

module.exports = WoWsAPIClient

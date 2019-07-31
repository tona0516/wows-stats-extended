const dotenv = require('dotenv')

class Env {
  /**
   * 環境変数を更新する
   */
  static refresh () {
    dotenv.config()
    this.envs = {
      'appid': process.env.APP_ID,
      'region': process.env.REGION,
      'directory': process.env.DIRECTORY,
    }
  }

  /**
   * 環境変数が有効かを判定
   *
   * param 有効ならtrue
   */
  static isValid () {
    return this.envs !== undefined
  }
}

Env.refresh()
module.exports = Env

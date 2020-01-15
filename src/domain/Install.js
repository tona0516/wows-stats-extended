'use strict'

const fs = require('fs')

class Install {
  constructor (wowsAPIClient, wowsFileRepository) {
    this.wowsAPIClient = wowsAPIClient
    this.wowsFileRepository = wowsFileRepository
  }

  getRegions () {
    return ['RU', 'EU', 'NA', 'ASIA']
  }

  async validateAppID (appid, region) {
    await this.wowsAPIClient.fetchEncyclopediaInfo(appid, region).catch((error) => {
      return false
    })

    return true
  }

  validateInstallDirectory (directory) {
    if (process.env.NODE_ENV === 'development') {
      return true
    }

    const exePath = directory + '\\WorldOfWarships.exe'
    return fs.existsSync(exePath)
  }

  saveParameter (parameters) {
    const contents = {
      APP_ID: parameters.appid,
      REGION: parameters.region === 'NA' ? 'com' : parameters.region.toLowerCase(),
      DIRECTORY: parameters.directory.endsWith('/') ? parameters.directory : parameters.directory + '/',
      PORT: 3000
    }

    this.wowsFileRepository.createDotEnv(contents)
  }
}

module.exports = Install

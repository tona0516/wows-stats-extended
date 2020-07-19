'use strict'

class Install {
  constructor (wowsAPIClient, wowsFileRepository) {
    this.wowsAPIClient = wowsAPIClient
    this.wowsFileRepository = wowsFileRepository
  }

  getRegions () {
    return ['RU', 'EU', 'NA', 'ASIA']
  }

  async validateAppId (appid, region) {
    await this.wowsAPIClient.fetchEncyclopediaInfo(appid, region).catch(_ => {
      return false
    })

    return true
  }

  saveParameter (parameters) {
    const contents = {
      APP_ID: parameters.appid,
      REGION: parameters.region === 'NA' ? 'com' : parameters.region.toLowerCase(),
      DIRECTORY: parameters.directory.endsWith('/') ? parameters.directory : parameters.directory + '/'
    }

    this.wowsFileRepository.createDotEnv(contents)
  }
}

module.exports = Install

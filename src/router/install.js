'use strict'

const express = require('express')

const WoWsAPIClient = require('../infrastructure/WoWsAPIClient')
const WoWsFileRepository = require('../repository/WoWsFileRepository')
const Install = require('../domain/Install')

const wowsAPIClient = new WoWsAPIClient()
const wowsFileRepository = new WoWsFileRepository()
const install = new Install(wowsAPIClient, wowsFileRepository)

const router = express.Router()

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('install', { servers: install.getRegions() })
})

router.post('/', (req, res, next) => {
  if (!install.validateAppID(req.body.appid, req.body.region)) {
    res.render(
      'Install',
      {
        messages: {
          appid_error: '不正なアプリケーションIDです。'
        },
        parameters: req.body,
        servers: install.getRegions()
      }
    )
    return
  }

  if (!install.validateInstallDirectory(req.body.directory)) {
    res.render(
      'Install',
      {
        messages: {
          directory_error: 'インストール先が不正です。「WorldOfWarships.exe」があるフォルダを指定してください。'
        },
        parameters: req.body,
        servers: install.getRegions()
      }
    )
    return
  }

  install.saveParameter(req.body)
  res.redirect('/')
})

module.exports = router

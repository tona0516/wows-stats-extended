const request = require('request')
const fs = require('fs')
const express = require('express')
const router = express.Router()

const SERVERS = ['RU', 'EU', 'NA', 'ASIA']

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('install', { servers: SERVERS })
})

router.post('/', async function (req, res, next) {
  const validateResult = await validateParameter(req.body)
  if (validateResult.isValid) {
    saveParameter(req.body)
    res.redirect('/')
    return
  }

  res.render('install', { messages: validateResult.messages, parameters: req.body, servers: SERVERS })
})

const validateParameter = async function (parameters) {
  const appid = parameters.appid
  const region = parameters.region
  const directory = parameters.directory
  let isValid = true
  let messages = {}

  if (!await validateAppID(appid, region)) {
    isValid = false
    messages.appid_error = '不正なアプリケーションIDです。'
  }

  if (!validateInstallDirectory(directory)) {
    isValid = false
    messages.directory_error = 'インストール先が不正です。「WorldOfWarships.exe」があるフォルダを指定してください。'
  }

  return { isValid: isValid, messages: messages }
}

const validateAppID = function (appid, region) {
  // サーバにリクエストしてデータが取得できるか確かめる
  const topLevelDomain = (region === 'NA') ? 'com' : region
  return new Promise((resolve, reject) => {
    request.get({
      url: 'https://api.worldofwarships.' + topLevelDomain.toLowerCase() + '/wows/encyclopedia/info/',
      qs: {
        application_id: appid
      }
    }, function (error, response, body) {
      const json = JSON.parse(body)
      return json.status === 'ok' ? resolve(true) : resolve(false)
    })
  })
}

const validateInstallDirectory = function (directory) {
  return true
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const exePath = directory + '\\WorldOfWarships.exe'
  try {
    fs.statSync(exePath)
    return true
  } catch (err) {
    return false
  }
}

const saveParameter = function (parameters) {
  if (!parameters.directory.endsWith('/')) {
    parameters.directory = parameters.directory + '/'
  }

  // dotenvに書き込む
  const rows = {
    APP_ID: parameters.appid,
    REGION: parameters.region.toLowerCase(),
    DIRECTORY: parameters.directory,
    PORT: 3000
  }
  let list = []
  for (let key in rows) {
    list.push(key + '=' + rows[key])
  }
  const contents = list.join('\n')
  fs.writeFileSync('.env', contents)
}

module.exports = router

const request = require('request');
const express = require('express');
const log4js = require('log4js');
const dotenv = require('dotenv');
const DataFetcher = require('../domains/datafetcher');
const FileObserver = require('../domains/fileobserver');
const dataFetcher = new DataFetcher()
const fileObserver = new FileObserver(dataFetcher, './tmp/tempArenaInfo.json');
var lastFetchedJson;

const router = express.Router();
const logger = log4js.getLogger();
logger.level = 'DEBUG';

dotenv.config();
const appid = process.env.APP_ID;
console.log("APP_ID: " + appid);

/* GET users listing. */

// wows apiから取得する
router.get('/fetch', function(req, res, next) {
  fileObserver.start(function(body, status) {
    switch (status) {
      case 200:
        // 更新があった時はAPIコールして取得したデータを返却する
        dataFetcher.fetch(body, function(json) {
          lastFetchedJson = json;
          res.status(status);
          res.send(json);
        });
        break;
      case 201:
        // 同一ファイルの時は最後にfetchしたデータを返却する
        res.status(status);
        res.send(lastFetchedJson);
        break;
      default:
        res.status(status);
        res.send(body);
        break;
    }
  });
});

// プレイヤーIDの取得
router.get('/playerid', function(req, res, next) {
  request.get({
    url: 'https://api.worldofwarships.asia/wows/account/list/',
    qs: {
      application_id: appid,
      search: req.query.playername
    }
  }, function(error, response, body) {
    const json = JSON.parse(body);
    if (json.status == 'error') {
      logger.error('request: ' + JSON.stringify(req.query) + ' error: ' + json.error.message);
      res.send('{"playerid": null}');
      return;
    }
    const playerId = json.data[0].account_id;
    res.send('{"playerid": ' + playerId + '}');
  });
});

// プレイヤー成績の取得
router.get('/stat/player', function(req, res, next) {
  request.get({
    url: 'https://api.worldofwarships.asia/wows/account/info/',
    qs: {
      application_id: appid,
      account_id: req.query.playerid
    }
  }, function(error, response, body) {
    const json = JSON.parse(body);
    if (json.status == 'error') {
      logger.error('request: ' + JSON.stringify(req.query) + ' error: ' + json.error.message);
      res.send('{"playerstat": null}');
      return;
    }
    res.send(json);
  });
});

// 艦艇別成績の取得
router.get('/stat/ship', function(req, res, next) {
  request.get({
    url: 'https://api.worldofwarships.asia/wows/ships/stats/',
    qs: {
      application_id: appid,
      account_id: req.query.playerid,
      ship_id: req.query.shipid
    }
  }, function(error, response, body) {
    const json = JSON.parse(body);
    if (json.status == 'error') {
      logger.error('request: ' + JSON.stringify(req.query) + ' error: ' + json.error.message);
      res.send('{"shipstat": null}');
      return;
    }
    res.send(json);
  });
});

// 艦艇データの取得
router.get('/info/ship', function(req, res, next) {
  request.get({
    url: 'https://api.worldofwarships.asia/wows/encyclopedia/ships/',
    qs: {
      application_id: appid,
      ship_id: req.query.shipid
    }
  }, function(error, response, body) {
    const json = JSON.parse(body);
    if (json.status == 'error') {
      logger.error('request: ' + JSON.stringify(req.query) + ' error: ' + json.error.message);
      res.send('{"shipinfo": null}');
      return;
    }
    res.send(json);
  });
});

module.exports = router;

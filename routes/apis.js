const request = require('request');
const express = require('express');
const log4js = require('log4js');
const dotenv = require('dotenv');
const DataFetcher = require('../domains/datafetcher');
const DataPicker = require('../domains/datapicker');
const FileObserver = require('../domains/fileobserver');
const dataFetcher = new DataFetcher()
const dataPicker = new DataPicker();
const fileObserver = new FileObserver(dataFetcher, './tmp/tempArenaInfo.json');
var lastPickedJson;

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
        dataFetcher.fetch(body, function(players, tiers) {
          const picked = dataPicker.pick(players, tiers);
          lastPickedJson = picked;
          res.status(status);
          res.send(picked);
        });
        break;
      case 209:
        // 同一ファイルの時は最後にpickしたデータを返却する
        res.status(status);
        res.send(lastPickedJson);
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
      search: req.query.search,
      type: "exact"
    }
  }, function(error, response, body) {
    const json = JSON.parse(body);
    if (json.status == 'error') {
      logger.error('request: ' + JSON.stringify(req.query) + ' error: ' + json.error.message);
      res.send(body);
      return;
    }
    res.send(body);
  });
});

// プレイヤー所属クランのIDを取得
router.get('/clanid', function(req, res, next) {
  request.get({
    url: 'https://api.worldofwarships.asia/wows/clans/accountinfo/',
    qs: {
      application_id: appid,
      account_id: req.query.playerid
    }
  }, function(error, response, body) {
      const json = JSON.parse(body);
      if (json.status == 'error') {
        logger.error('request: ' + JSON.stringify(req.query) + ' error: ' + json.error.message);
        res.send('{"clanid": null}');
        return;
      }
      res.send(json);
  });
});

// クラン情報の取得
router.get('/info/clan', function(req, res, next) {
  request.get({
    url: 'https://api.worldofwarships.asia/wows/clans/info/',
    qs: {
      application_id: appid,
      clan_id: req.query.clanid
    }
  }, function(error, response, body) {
      const json = JSON.parse(body);
      if (json.status == 'error') {
        logger.error('request: ' + JSON.stringify(req.query) + ' error: ' + json.error.message);
        res.send('{"clan": null}');
        return;
      }
      res.send(json);
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
      account_id: req.query.playerid
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

router.get('/info/encyclopedia', function(req, res, next) {
  request.get({
    url: 'https://api.worldofwarships.asia/wows/encyclopedia/info/',
    qs: {
      application_id: appid,
      fields: "ship_type_images, ship_nations",
      language: "ja"
    }
  }, function(error, response, body) {
    const json = JSON.parse(body);
    if (json.status == 'error') {
      logger.error('request: ' + JSON.stringify(req.query) + ' error: ' + json.error.message);
      res.send('{"encyclopedia": null}');
      return;
    }
    res.send(json.data);
  });
});

router.get('/info/ship_tier', function(req, res, next) {
  request.get({
    url: "https://api.worldofwarships.asia/wows/encyclopedia/ships/",
    qs: {
      application_id: appid,
      fields: "tier",
      page_no: req.query.page_no
    }
  }, function(error, response, body) {
    const json = JSON.parse(body);
    if (json.status == 'error') {
      logger.error('request: ' + JSON.stringify(req.query) + ' error: ' + json.error.message);
      res.status(500);
      res.send(json.error);
      return;
    }

    res.send(json);
  });
});

module.exports = router;


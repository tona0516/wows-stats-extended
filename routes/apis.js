const request = require('request');
const rp = require('request-promise');

const express = require('express');
const router = express.Router();

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

const dotenv = require('dotenv');
dotenv.config();
var appid = process.env.APP_ID;
var region = process.env.REGION;
var directory = process.env.DIRECTORY;

const DataFetcher = require('../domains/datafetcher');
const DataPicker = require('../domains/datapicker');
const FileObserver = require('../domains/fileobserver');
var fileObserver = new FileObserver(directory + 'replays/tempArenaInfo.json');
var lastPickedJson;

/* GET users listing. */

// wows apiから取得する
router.get('/fetch', function(req, res, next) {
  refresh();
  fileObserver.start(function(body, status) {
    switch (status) {
      case 200:
        // 更新があった時はAPIコールして取得したデータを返却する
        const dataFetcher = new DataFetcher();
        dataFetcher.fetch(body, function(players, tiers) {
          const dataPicker = new DataPicker();
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
  requestCommon({
    url: 'https://api.worldofwarships.' + region + '/wows/account/list/',
    qs: {
      application_id: appid,
      search: req.query.search,
      type: "exact"
    }
  }, '/playerid', req, res);
});

// プレイヤー所属クランのIDを取得
router.get('/clanid', function(req, res, next) {
  requestCommon({
    url: 'https://api.worldofwarships.' + region + '/wows/clans/accountinfo/',
    qs: {
      application_id: appid,
      account_id: req.query.playerid
    }
  }, '/clanid', req, res);
});

// クラン情報の取得
router.get('/info/clan', function(req, res, next) {
  requestCommon({
    url: 'https://api.worldofwarships.' + region + '/wows/clans/info/',
    qs: {
      application_id: appid,
      clan_id: req.query.clanid
    }
  }, '/info/clan', req, res);
});

// プレイヤー成績の取得
router.get('/stat/player', function(req, res, next) {
  requestCommon({
    url: 'https://api.worldofwarships.' + region + '/wows/account/info/',
    qs: {
      application_id: appid,
      account_id: req.query.playerid
    }
  }, '/stat/player', req, res);
});

// 艦艇別成績の取得
router.get('/stat/ship', function(req, res, next) {
  requestCommon({
    url: 'https://api.worldofwarships.' + region + '/wows/ships/stats/',
    qs: {
      application_id: appid,
      account_id: req.query.playerid
    }
  }, '/stat/ship', req, res);
});

// 艦艇データの取得
router.get('/info/ship', function(req, res, next) {
  requestCommon({
    url: 'https://api.worldofwarships.' + region + '/wows/encyclopedia/ships/',
    qs: {
      application_id: appid,
      ship_id: req.query.shipid
    }
  }, 'info/ship', req, res);
});

router.get('/info/encyclopedia', function(req, res, next) {
  refresh();
  requestCommon({
    url: 'https://api.worldofwarships.' + region + '/wows/encyclopedia/info/',
    qs: {
      application_id: appid,
      fields: "ship_type_images, ship_nations",
      language: "ja"
    }
  }, '/info/encyclopedia', req, res);
});

router.get('/info/ship_tier', function(req, res, next) {
  refresh();
  requestCommon({
    url: 'https://api.worldofwarships.' + region + '/wows/encyclopedia/ships/',
    qs: {
      application_id: appid,
      fields: "tier",
      page_no: req.query.page_no
    }
  }, '/info/ship_tier', req, res);
});

const requestCommon = function (option, entryPointName, req, res) {
  rp(option)
  .then(function (body) {
    res.send(body);
  })
  .catch(function (error) {
    logger.error(entryPointName + ': ' + JSON.stringify(req.query) + ' error: ' + error);
    res.send();
  });
}

const refresh = function() {
  if (appid === undefined || region === undefined || directory === undefined) {
    dotenv.config();
    appid = process.env.APP_ID;
    region = process.env.REGION;
    directory = process.env.DIRECTORY;
    fileObserver = new FileObserver(directory + 'replays/tempArenaInfo.json');
  }
}

module.exports = router;


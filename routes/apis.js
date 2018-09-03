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
const tempArenaInfoPath = '/replays/tempArenaInfo.json';
var filePath = directory + tempArenaInfoPath;

const DataFetcher = require('../domains/DataFetcher');
const DataPicker = require('../domains/DataPicker');
const FileObserver = require('../domains/FileObserver');
var fileObserver = new FileObserver(filePath);
var latestTempArenaInfo;
var latestPicked;

/* GET users listing. */
router.get('/check_update', async function(req, res, next) {
  // 環境変数の再読み込み
  refresh();

  // tempArenaInfo.jsonの読み込み
  const tempArenaInfo = await fileObserver.read().catch(() => null);

  // ファイル読み込みに失敗したケース
  if (tempArenaInfo == null) {
    res.status(299);
    res.send();
    return;
  }

  // ファイルに変更がなかったケース
  if (tempArenaInfo === latestTempArenaInfo) {
    res.status(209);
    res.send();
    return;
  }

  // ファイルが更新されたケース
  latestTempArenaInfo = tempArenaInfo;
  res.status(200);
  res.send();
});

// wows apiから取得する
router.get('/fetch', function(req, res, next) {
  // 環境変数の再読み込み
  refresh();

  if (latestTempArenaInfo == null) {
    res.status(500);
    res.send();
    return;
  }

  const dataFetcher = new DataFetcher();
  dataFetcher.fetch(JSON.parse(latestTempArenaInfo), function(players, tiers) {
    const dataPicker = new DataPicker();
    const picked = dataPicker.pick(players, tiers);
    latestPicked = picked;
    res.status(200);
    res.send(picked);
  });
});

router.get('/fetch_cache', function(req, res, next) {
  if (latestPicked == null) {
    res.status(500);
    res.send();
    return;
  }

  res.status(200);
  res.send(latestPicked);
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
      clan_id: req.query.clanid,
      fields: 'tag'
    }
  }, '/info/clan', req, res);
});

// プレイヤー成績の取得
router.get('/stat/player', function(req, res, next) {
  requestCommon({
    url: 'https://api.worldofwarships.' + region + '/wows/account/info/',
    qs: {
      application_id: appid,
      account_id: req.query.playerid,
      fields: 'hidden_profile,statistics'
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
      ship_id: req.query.shipid,
      fields: 'name,type,tier,nation,default_profile.concealment',
      language: "ja"
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
    filePath = directory + tempArenaInfoPath;
    fileObserver = new FileObserver(filePath);
  }
}

module.exports = router;


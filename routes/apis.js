const request = require('request');
const rp = require('request-promise');

const express = require('express');
const router = express.Router();

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

const DataFetcher = require('../domains/DataFetcher');
const DataPicker = require('../domains/DataPicker');
const FileObserver = require('../domains/FileObserver');
const dotenv = require('dotenv');

const tempArenaInfoPath = '/replays/tempArenaInfo.json';

let latestTempArenaInfo;
let latestPicked;
let appid;
let region;
let directory;
let filePath;
let fileObserver;

/**
 * 環境変数を再読み込みする
 */
const refreshEnv = function() {
  if (appid === undefined || region === undefined || directory === undefined) {
    dotenv.config();
    appid = process.env.APP_ID;
    region = process.env.REGION;
    directory = process.env.DIRECTORY;
    filePath = directory + tempArenaInfoPath;
    fileObserver = new FileObserver(filePath);
  }
}
refreshEnv();

/**
 * 戦闘開始したかチェックする
 */
router.get('/check_update', async function(req, res, next) {
  // 環境変数の再読み込み
  refreshEnv();

  // tempArenaInfo.jsonの読み込み
  const tempArenaInfo = await fileObserver.read().catch(() => null);

  // 戦闘が開始していない場合
  if (tempArenaInfo == null) {
    res.status(299);
    res.send();
    return;
  }

  // 戦闘が継続している場合
  if (tempArenaInfo === latestTempArenaInfo) {
    res.status(209);
    res.send();
    return;
  }

  // 新しい戦闘が開始された場合
  latestTempArenaInfo = tempArenaInfo;
  res.status(200);
  res.send();
});

/**
 * APIから取得したデータを返却する
 */
router.get('/fetch', function(req, res, next) {
  // 環境変数の再読み込み
  refreshEnv();

  if (latestTempArenaInfo == null) {
    res.status(500);
    res.send(JSON.stringify({'error' : 'tempArenaInfo.json has not been read yet'}));
    return;
  }

  const dataFetcher = new DataFetcher();
  dataFetcher.fetch(JSON.parse(latestTempArenaInfo), function(players, tiers, error) {
    if (error !== null) {
      res.status(500);
      res.send(JSON.stringify({'error' : error}));
      return;
    }

    const dataPicker = new DataPicker();
    const picked = dataPicker.pick(players, tiers);
    latestPicked = picked;
    res.status(200);
    res.send(picked);
  });
});

/**
 * 直近に取得したデータを返却する
 */
router.get('/fetch_cache', function(req, res, next) {
  if (latestPicked == null) {
    res.status(500);
    res.send(JSON.stringify({'error' : 'No fetched cache exists'}));
    return;
  }

  res.status(200);
  res.send(latestPicked);
});

/**
 * 艦種アイコンと日本語表記の国名を返却する
 */
router.get('/info/encyclopedia', function(req, res, next) {
  refreshEnv();
  requestCommon({
    url: generateApiUrl('/encyclopedia/info/'),
    qs: {
      application_id: appid,
      fields: "ship_type_images, ship_nations",
      language: "ja"
    }
  }, '/info/encyclopedia', req, res);
});

/* 以下内部で使用するエントリーポイント */

// プレイヤーIDの取得
router.get('/playerid', function(req, res, next) {
  requestCommon({
    url: generateApiUrl('/account/list/'),
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
    url: generateApiUrl('/clans/accountinfo/'),
    qs: {
      application_id: appid,
      account_id: req.query.playerid
    }
  }, '/clanid', req, res);
});

// クラン情報の取得
router.get('/info/clan', function(req, res, next) {
  requestCommon({
    url: generateApiUrl('/clans/info/'),
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
    url: generateApiUrl('/account/info/'),
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
    url: generateApiUrl('/ships/stats/'),
    qs: {
      application_id: appid,
      account_id: req.query.playerid
    }
  }, '/stat/ship', req, res);
});

// 艦艇データの取得
router.get('/info/ship', function(req, res, next) {
  requestCommon({
    url: generateApiUrl('/encyclopedia/ships/'),
    qs: {
      application_id: appid,
      ship_id: req.query.shipid,
      fields: 'name,type,tier,nation,default_profile.concealment',
      language: "ja"
    }
  }, 'info/ship', req, res);
});

router.get('/info/ship_tier', function(req, res, next) {
  refreshEnv();
  requestCommon({
    url: generateApiUrl('/encyclopedia/ships/'),
    qs: {
      application_id: appid,
      fields: "tier",
      page_no: req.query.page_no
    }
  }, '/info/ship_tier', req, res);
});

/**
 * APIにリクエストする共通メソッド
 * 
 * @param {Object} option 
 * @param {String} entryPointName 
 * @param {Object} req 
 * @param {Object} res 
 */
const requestCommon = function (option, entryPointName, req, res) {
  rp(option)
  .then(function(body) {
    res.send(body);
  })
  .catch(function(error) {
    logger.error(error);
    res.status(500);
    res.send(JSON.stringify({'error' : error}));
  });
}

/**
 * WOWS-APIのURLを生成する
 *
 * @param {String} path
 */
const generateApiUrl = function(path) {
  return 'https://api.worldofwarships.' + region + '/wows' +  path;
}

module.exports = router;


const Util = require('../domains/Util');
const Env = require('../domains/Env');

const request = require('request');
const rp = require('request-promise');

const express = require('express');
const router = express.Router();

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

// プレイヤーIDの取得
router.get('/playerid', function(req, res, next) {
  requestCommon({
    url: Util.generateApiUrl('/account/list/'),
    qs: {
      application_id: Env.appid,
      search: req.query.search,
      type: "exact"
    }
  }, '/playerid', req, res);
});

// プレイヤー所属クランのIDを取得
router.get('/clanid', function(req, res, next) {
  requestCommon({
    url: Util.generateApiUrl('/clans/accountinfo/'),
    qs: {
      application_id: Env.appid,
      account_id: req.query.playerid
    }
  }, '/clanid', req, res);
});

// クラン情報の取得
router.get('/info/clan', function(req, res, next) {
  requestCommon({
    url: Util.generateApiUrl('/clans/info/'),
    qs: {
      application_id: Env.appid,
      clan_id: req.query.clanid,
      fields: 'tag'
    }
  }, '/info/clan', req, res);
});

// プレイヤー成績の取得
router.get('/stat/player', function(req, res, next) {
  requestCommon({
    url: Util.generateApiUrl('/account/info/'),
    qs: {
      application_id: Env.appid,
      account_id: req.query.playerid,
      fields: 'hidden_profile,statistics'
    }
  }, '/stat/player', req, res);
});

// 艦艇別成績の取得
router.get('/stat/ship', function(req, res, next) {
  requestCommon({
    url: Util.generateApiUrl('/ships/stats/'),
    qs: {
      application_id: Env.appid,
      account_id: req.query.playerid
    }
  }, '/stat/ship', req, res);
});

// 艦艇データの取得
router.get('/info/ship', function(req, res, next) {
  requestCommon({
    url: Util.generateApiUrl('/encyclopedia/ships/'),
    qs: {
      application_id: Env.appid,
      ship_id: req.query.shipid,
      fields: 'name,type,tier,nation,default_profile.concealment',
      language: "ja"
    }
  }, 'info/ship', req, res);
});

// 艦艇-Tierのデータの取得
router.get('/info/ship_tier', function(req, res, next) {
  requestCommon({
    url: Util.generateApiUrl('/encyclopedia/ships/'),
    qs: {
      application_id: Env.appid,
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

module.exports = router;

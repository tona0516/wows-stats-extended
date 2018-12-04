const Util = require('../domains/Util');
const Env = require('../domains/Env');

const express = require('express');
const router = express.Router();

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

/**
 * プレイヤー名のリストからプレイヤーIDのリストを取得
 */
router.get('/playerid', function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/account/list/'),
        qs: {
            application_id: Env.appid,
            search: req.query.search,
            type: "exact"
        }
    }, req, res);
});

/** 
 * プレイヤーIDから所属クランIDを取得
 */
router.get('/clanid', function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/clans/accountinfo/'),
        qs: {
            application_id: Env.appid,
            account_id: req.query.playerid
        }
    }, req, res);
});

/**
 * クランIDからクラン名を取得
 */
router.get('/info/clan', function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/clans/info/'),
        qs: {
            application_id: Env.appid,
            clan_id: req.query.clanid,
            fields: 'tag'
        }
    }, req, res);
});

/**
 * プレイヤー成績を取得
 */
router.get('/stat/player', function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/account/info/'),
        qs: {
            application_id: Env.appid,
            account_id: req.query.playerid,
            fields: 'hidden_profile,statistics'
        }
    }, req, res);
});

/**
 * プレイヤーの艦艇別成績を取得
 */
router.get('/stat/ship', function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/ships/stats/'),
        qs: {
            application_id: Env.appid,
            account_id: req.query.playerid
        }
    }, req, res);
});

/**
 * 艦性能を取得
 */
router.get('/info/ship', function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/encyclopedia/ships/'),
        qs: {
            application_id: Env.appid,
            ship_id: req.query.shipid,
            fields: 'name,type,tier,nation,default_profile.concealment',
            language: "ja"
        }
    }, req, res);
});

/**
 * 艦艇-Tierのマッピングデータを取得
 */
router.get('/info/ship_tier', function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/encyclopedia/ships/'),
        qs: {
            application_id: Env.appid,
            fields: "name,tier",
            page_no: req.query.page_no
        }
    }, req, res);
});

/**
 * ゲームのバージョンを返却する
 */
router.get('/info/version', function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/encyclopedia/info/'),
        qs: {
            application_id: Env.appid,
            fields: "game_version",
            language: "ja"
        }
    }, req, res);
});

module.exports = router;

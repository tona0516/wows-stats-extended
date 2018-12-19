const Util = require('../domains/Util');
const Env = require('../domains/Env');
const EntryPoint = require('../domains/EntryPoint');

const express = require('express');
const router = express.Router();

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

/**
 * プレイヤー名のリストからプレイヤーIDのリストを取得
 */
router.get(EntryPoint.Internal.PLAYER.ID, function (req, res, next) {
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
router.get(EntryPoint.Internal.CLAN.ID, function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/clans/accountinfo/'),
        qs: {
            application_id: Env.appid,
            account_id: req.query.playerid,
            fields: 'clan_id'
        }
    }, req, res);
});

/**
 * クランIDからクラン名を取得
 */
router.get(EntryPoint.Internal.CLAN.INFO, function (req, res, next) {
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
router.get(EntryPoint.Internal.PLAYER.STAT, function (req, res, next) {
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
router.get(EntryPoint.Internal.SHIP.STAT, function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/ships/stats/'),
        qs: {
            application_id: Env.appid,
            account_id: req.query.playerid,
            fields: 'ship_id,pvp.frags,pvp.battles,pvp.survived_battles,pvp.damage_dealt,pvp.xp,pvp.wins'
        }
    }, req, res);
});

/**
 * 艦性能を取得
 */
router.get(EntryPoint.Internal.SHIP.INFO, function (req, res, next) {
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
router.get(EntryPoint.Internal.SHIP_TIER.INFO, function (req, res, next) {
    Util.requestCommon({
        url: Util.generateApiUrl('/encyclopedia/ships/'),
        qs: {
            application_id: Env.appid,
            fields: "name,tier,type,nation,default_profile.concealment.detect_distance_by_ship",
            page_no: req.query.page_no,
        }
    }, req, res);
});

/**
 * ゲームのバージョンを返却する
 */
router.get(EntryPoint.Internal.VERSION, function (req, res, next) {
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

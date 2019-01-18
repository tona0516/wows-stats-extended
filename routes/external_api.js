const Env = require('../domains/Env');
const EntryPoint = require('../domains/EntryPoint');
const WoWsAPIWrapper = require('../domains/WoWsAPIWrapper');
const WoWsDataShaper = require('../domains/WoWsDataShaper');

const rp = require('request-promise');

const express = require('express');
const router = express.Router();

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

const {
  JSDOM
} = require('jsdom');

const DataFetcher = require('../domains/DataFetcher');
const DataPicker = require('../domains/DataPicker');
const FileObserver = require('../domains/FileObserver');

let latestTempArenaInfo;

/**
 * 戦闘開始したかチェックする
 */
router.get(EntryPoint.External.CHECK_UPDATE, async function (req, res, next) {
  // 環境変数の再読み込み
  Env.refresh();

  // tempArenaInfo.jsonの読み込み
  const fileObserver = new FileObserver(Env.installDir);
  const tempArenaInfo = await fileObserver.read().catch(() => null);

  // 戦闘が開始していない場合
  if (tempArenaInfo === null) {
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
router.get(EntryPoint.External.FETCH, async function (req, res, next) {
  const startTime = new Date();

  // 環境変数の再読み込み
  Env.refresh();

  if (latestTempArenaInfo === null) {
    res.status(500);
    res.send(JSON.stringify({ 'error': 'tempArenaInfo.json has not been read yet. please request /check_update endpoint before requesting to me' }));
    return;
  }

  const wrapper = new WoWsAPIWrapper(JSON.parse(latestTempArenaInfo));
  logger.info('WowsAPIWrapper.fetchPlayers() start');
  
  let players;
  try {
    players = wrapper.fetchPlayers();
  } catch (e) {
    res.status(500);
    res.send(JSON.stringify({ 'error': fetchPlayerError }));
    return;
  }

  let allShips;
  try {
    allShips = wrapper.fetchAllShips();
  } catch (e) {
    res.status(500);
    res.send(JSON.stringify({ 'error': fetchAllShipError}));
    return;
  }

  logger.info(allShips);

  const shaper = new WoWsDataShaper();

  let shaped;
  try {
    shaped = shaper.shape(players, allShips);
  } catch (e) {
    res.status(500);
    res.send(JSON.stringify({ 'error': shapeError }));
    return;
  }

  res.status(200);
  res.send(shaped);
  logger.info('Elapsed time: ' + ((new Date().getTime() - startTime.getTime()) / 1000.0).toFixed(2) + ' seconds');
});

/**
 * WIP
 * ページをスクレイピングして正確な隠蔽距離を取得する
 * バージョンがあがったときにたたくようにする
 */
router.get('/info/ship_concealment', function (req, res, next) {
  rp({
    url: 'http://wiki.wargaming.net/en/Ship:' + req.query.ship_name
  })
    .then(function (body) {
      const dom = new JSDOM(body);
      const shipParams = dom.window.document.querySelectorAll('.t-performance_right');
      const concealment = shipParams[shipParams.length - 2].textContent.replace('km.', '').trim();
      logger.debug(concealment);
      res.send(concealment);
    })
    .catch(function (error) {
      logger.error(error);
      res.status(500);
      res.send(JSON.stringify({ 'error': error }));
    });
})

module.exports = router;

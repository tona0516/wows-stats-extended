const Util = require('../domains/Util');
const Env = require('../domains/Env');

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
router.get('/check_update', async function (req, res, next) {
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
router.get('/fetch', function (req, res, next) {
  const startTime = new Date();

  // 環境変数の再読み込み
  Env.refresh();

  if (latestTempArenaInfo === null) {
    res.status(500);
    res.send(JSON.stringify({ 'error': 'tempArenaInfo.json has not been read yet. please request /check_update endpoint before requesting to me' }));
    return;
  }

  const dataFetcher = new DataFetcher();
  dataFetcher.fetch(JSON.parse(latestTempArenaInfo), function (players, tiers, error) {
    if (error !== null) {
      res.status(500);
      res.send(JSON.stringify({ 'error': error }));
      return;
    }

    const dataPicker = new DataPicker();
    const picked = dataPicker.pick(players, tiers);
    res.status(200);
    res.send(picked);
    logger.info('Elapsed time: ' + ((new Date().getTime() - startTime.getTime()) / 1000.0).toFixed(2) + ' seconds')
  });
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

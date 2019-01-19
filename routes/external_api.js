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
    res.sendStatus(299);
    return;
  }

  // 戦闘が継続している場合
  if (tempArenaInfo === latestTempArenaInfo) {
    res.sendStatus(209);
    return;
  }

  // 新しい戦闘が開始された場合
  latestTempArenaInfo = tempArenaInfo;
  res.sendStatus(200);
});

/**
 * APIから取得したデータを返却する
 */
router.get(EntryPoint.External.FETCH, (req, res, next) => {
  res.set('Content-Type', 'application/json');
  const startTime = new Date();

  // 環境変数の再読み込み
  Env.refresh();

  if (latestTempArenaInfo === null) {
    res.status(500).json({'error': 'tempArenaInfo.json has not been read yet. please request /check_update endpoint before requesting to me'});
    return;
  }

  const wrapper = new WoWsAPIWrapper(JSON.parse(latestTempArenaInfo));
  logger.info('WowsAPIWrapper.fetchPlayers() start');
  
  let promise1 = wrapper.fetchPlayers();
  let promise2 = wrapper.fetchAllShips();
  Promise.all([promise1, promise2]).then(([players, allShips]) => {    
    const shaper = new WoWsDataShaper();
    let shaped = shaper.shape(players, allShips);

    logger.debug(JSON.stringify(shaped));

    const elapsedTime = (new Date().getTime() - startTime.getTime()) / 1000.0;
    logger.info(`処理時間: ${elapsedTime.toFixed(2)}秒`);

    res.status(200).json(shaped);
  }).catch((error) => {
    res.status(500).json({'error': error});
  });
});

module.exports = router;

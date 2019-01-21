const Env = require('../domains/Env');
const WoWsAPIWrapper = require('../domains/WoWsAPIWrapper');
const WoWsDataShaper = require('../domains/WoWsDataShaper');

const express = require('express');
const router = express.Router();

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

const FileObserver = require('../domains/FileObserver');

let latestTempArenaInfo;

/**
 * 戦闘開始したかチェックする
 */
router.get('/check_update', async (req, res, next) => {
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
router.get('/fetch', (req, res, next) => {
  // 環境変数の再読み込み
  Env.refresh();

  const startTime = new Date();

  if (latestTempArenaInfo === null) {
    res.status(500).json({'error': 'tempArenaInfo.json has not been read yet. please request /check_update endpoint before requesting to me'});
    return;
  }

  const wrapper = new WoWsAPIWrapper(JSON.parse(latestTempArenaInfo));
  logger.info('WowsAPIWrapper.fetchPlayers() start');
  
  let fetchPlayersPromise = wrapper.fetchPlayers();
  let fetchAllShipsPromise = wrapper.fetchAllShips();

  Promise.all([fetchPlayersPromise, fetchAllShipsPromise]).then(([players, allShips]) => {    
    const shaper = new WoWsDataShaper(players, allShips);
    let shaped = shaper.shape();

    const elapsedTime = (new Date().getTime() - startTime.getTime()) / 1000.0;
    logger.info(`処理時間: ${elapsedTime.toFixed(2)}秒`);

    res.status(200).json(shaped);
  }).catch((error) => {
    res.status(500).json({'error': error});
  });
});

module.exports = router;

var request = require('request');
var express = require('express');
var router = express.Router();

/* GET users listing. */

// プレイヤーIDの取得
router.get('/playerid', function(req, res, next) {
  console.log(req.query.appid);
  console.log(req.query.playername);
  request.get({
    url: 'https://api.worldofwarships.asia/wows/account/list/',
    qs: {
      application_id: req.query.appid,
      search: req.query.playername
    }
  }, function(error, response, body) {
    json = JSON.parse(body);
    playerid = json.data[0].account_id;
    res.send('{playerid: ' + playerid + '}');
  });
});

// プレイヤー成績の取得
router.get('/stat/player', function(req, res, next) {
  console.log(req.query.appid);
  console.log(req.query.playerid);
  request.get({
    url: 'https://api.worldofwarships.asia/wows/account/info/',
    qs: {
      application_id: req.query.appid,
      account_id: req.query.playerid
    }
  }, function(error, response, body) {
    res.send(body);
  });
});

// 艦艇別成績の取得
router.get('/stat/ship', function(req, res, next) {
  console.log(req.query.appid);
  console.log(req.query.playerid);
  console.log(req.query.shipid);
  request.get({
    url: 'https://api.worldofwarships.asia/wows/ships/stats/',
    qs: {
      application_id: req.query.appid,
      account_id: req.query.playerid,
      ship_id: req.query.shipid
    }
  }, function(error, response, body) {
    res.send(body);
  });
});

// 艦艇データの取得
router.get('/info/ship', function(req, res, next) {
  console.log(req.query.appid);
  console.log(req.query.shipid);
  request.get({
    url: 'https://api.worldofwarships.asia/wows/encyclopedia/shipprofile/',
    qs: {
      application_id: req.query.appid,
      ship_id: req.query.shipid
    }
  }, function(error, response, body) {
    res.send(body);
  });
});

module.exports = router;

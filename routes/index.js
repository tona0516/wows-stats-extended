const dotenv = require('dotenv');

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  // dotenv読み込み
  dotenv.config();
  const appid = process.env.APP_ID;
  const region = process.env.REGION;
  const directory = process.env.DIRECTORY;

  // 未インストールならインストールページにリダイレクト
  const isInstalled = (appid !== undefined && region !== undefined && directory !== undefined);
  if (isInstalled) {
    res.render('index', { title: 'wows-stat-extended' });
  } else {
    res.redirect('/install');
  }
});

module.exports = router;

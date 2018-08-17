const dotenv = require('dotenv');

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  dotenv.config();
  const appid = process.env.APP_ID;
  const region = process.env.REGION;
  if (appid == undefined || region == undefined) {
    res.redirect('/install');
    return;
  }
  res.render('index', { title: 'wows-stat-extended' });
});

module.exports = router;

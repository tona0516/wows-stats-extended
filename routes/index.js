const Env = require('../domains/Env');

const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  Env.refresh();

  // 未インストールならインストールページにリダイレクト
  if (Env.isValid()) {
    res.render('index', { title: 'wows-stat-extended' });
  } else {
    res.redirect('/install');
  }
});

module.exports = router;

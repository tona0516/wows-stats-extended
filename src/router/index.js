'use strict'

const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', (req, res, next) => {
  // 未インストールならインストールページにリダイレクト
  if (process.env.APP_ID && process.env.REGION && process.env.DIRECTORY) {
    res.render('index', { title: 'wows-stat-extended' })
  } else {
    res.redirect('/install')
  }
})

module.exports = router

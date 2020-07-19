'use strict'

require('pug')

const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const log4js = require('log4js')

const indexRouter = require('./src/router/index')
const installRouter = require('./src/router/install')
const apiRouter = require('./src/router/api')

const app = express()
require('dotenv').config()

// logger setup
const logger = log4js.getLogger()
switch (process.env.NODE_ENV) {
  case 'development':
    logger.level = log4js.levels.DEBUG
    app.use(log4js.connectLogger(logger, { level: log4js.levels.DEBUG, format: ':method :url HTTP/:http-version" :status' }))
    break
  default:
    logger.level = log4js.levels.INFO
    break
}

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// router setup
app.use('/', indexRouter)
app.use('/install', installRouter)
app.use('/api', apiRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app

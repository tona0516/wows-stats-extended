var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var request = require('request');

var indexRouter = require('./routes/index');
var apiRouter = require('./routes/apis');

var app = express();

var FileObserver = require('./domains/fileobserver');
var DataFetcher = require('./domains/datafetcher');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/apis', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// start observing file 'tempArenaInfo.json'
const dataFetcher = new DataFetcher();
const fileObserver = new FileObserver(dataFetcher, './tmp/tempArenaInfo.json')
fileObserver.start(function(json) {
  dataFetcher.fetch(json, function() {
    console.log("-----done!-----");
  });
}, 1000);

module.exports = app;

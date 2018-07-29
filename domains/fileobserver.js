const fs = require('fs');
const log4js = require('log4js');

const logger = log4js.getLogger();
logger.level = 'DEBUG';

const FileObserver = function(dataFetcher, filepath) {
  this.dataFetcher = dataFetcher;
  this.filepath = filepath;
}

FileObserver.prototype.start = function(callback) {
  const _this = this;

  fs.readFile(_this.filepath, 'utf8', function (error, text) {
    // エラー
    if(error) {
      const body = 'error is caused: ' + error;
      logger.info(body);
      return callback(body, 500);
    }

    // 同一ファイルの時
    if(_this.latest == text) {
      const body = 'no need to update data'
      logger.info(body);
      return callback(body, 201);
    }

    // 最新の状態を保存してjsonを返却
    _this.latest = text;
    return callback(JSON.parse(text), 200);
  });
}

// これを書くことでrequire先でFileObserverが使えるようになる
module.exports = FileObserver;

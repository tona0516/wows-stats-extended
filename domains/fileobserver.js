const fs = require('fs');
const log4js = require('log4js');

const logger = log4js.getLogger();
logger.level = 'DEBUG';

const FileObserver = function(dataFetcher, filepath) {
  this.dataFetcher = dataFetcher;
  this.filepath = filepath;
}

FileObserver.prototype.start = function(callback, interval) {
  const _this = this;

  // 定期実行開始
  setInterval(function() {
    fs.readFile(_this.filepath, 'utf8', function (error, text) {
      // エラー時はコールバックしない
      if(error) {
        logger.info('error is caused: ' + error);
        return;
      }

      // 同一ファイルでないときもコールバックしない
      if(_this.latest == text) {
        logger.info('no need to update data');
        return;
      }

      // データ取得中の時もコールバックしない
      if(_this.dataFetcher.isRunning) {
        logger.info('no need to update data');
        return;
      }

      // 最新の状態を保存してjsonを返却
      _this.latest = text;
      return callback(JSON.parse(text));
    });
  }, interval);
}

// これを書くことでrequire先でFileObserverが使えるようになる
module.exports = FileObserver;

const fs = require('fs');
const log4js = require('log4js');

const logger = log4js.getLogger();
logger.level = 'DEBUG';

const FileObserver = function(filepath) {
  this.filepath = filepath;
}

FileObserver.prototype.read = function() {
  const _this = this;

  return new Promise((resolve, reject) => {
    fs.readFile(_this.filepath, 'utf8', function (error, text) {
      // ファイル読み込みに失敗した場合（ファイルがない場合）
      if(error) {
        return reject();
      }

      // 最新の状態を保存してjsonを返却
      return resolve(text);
    });
  });
}

// これを書くことでrequire先でFileObserverが使えるようになる
module.exports = FileObserver;

const fs = require('fs');

var FileObserver = function(filepath) {
  this.filepath = filepath;
}

FileObserver.prototype.start = function(callback, interval) {
  var weakthis = this;

  // 定期実行開始
  setInterval(function() {
    fs.readFile(weakthis.filepath, 'utf8', function (err, text) {
      // エラー時はコールバックしない
      if (err) {
        return;
      }

      // 同一ファイルでないときもコールバックしない
      if (weakthis.latest === text) {
        return;
      }
      weakthis.latest = text;

      // jsonを返却
      var json = JSON.parse(text);
      return callback(json);
    });
  }, interval);
}

// これを書くことでrequire先でFileObserverが使えるようになる
module.exports = FileObserver;

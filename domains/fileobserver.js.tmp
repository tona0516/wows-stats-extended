const fs = require('fs');

class FileObserver {
  constructor(filepath) {
    this.filepath = filepath;
  }

  read() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filepath, 'utf8', (error, data) => {
        if (error != null) {
          // ファイル読み込みに失敗した場合（ファイルがない場合）
          return reject(error);
        } else {
          // 最新の状態を保存してjsonを返却
          return resolve(data)
        }
      });
    });
  }
}

module.exports = FileObserver;

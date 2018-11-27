const fs = require('fs');

const TEMP_ARENA_INFO_PATH = '/replays/tempArenaInfo.json';

class FileObserver {
  constructor(installDir) {
    if (!installDir.endsWith("/")) {
      installDir = installDir + "/";
    }
    this.filepath = installDir + TEMP_ARENA_INFO_PATH;
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

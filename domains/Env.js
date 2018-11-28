const dotenv = require('dotenv');

class Env {
    /**
     * 環境変数を更新する
     */
    static refresh() {
        dotenv.config();
        
        if (this.appid === undefined) {
            this.appid = process.env.APP_ID;
        }

        if (this.region === undefined) {
            this.region = process.env.REGION;
        }

        if (this.installDir === undefined) {
            this.installDir = process.env.DIRECTORY;
        }
    }
}

Env.refresh();
module.exports = Env;

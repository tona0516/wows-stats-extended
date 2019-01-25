const dotenv = require('dotenv');

class Env {
    /**
     * 環境変数を更新する
     */
    static refresh() {
        dotenv.config();
        this.appid = process.env.APP_ID;
        this.region = process.env.REGION;
        this.installDir = process.env.DIRECTORY;
        this.port = process.env.PORT;
    }

    /**
     * @param 環境変数が有効ならtrue
     */
    static isValid() {
        return (this.appid !== undefined && this.region !== undefined && this.installDir !== undefined && this.port !== undefined)
    }
}

Env.refresh();
module.exports = Env;

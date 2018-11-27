const dotenv = require('dotenv');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

class Env {
    static refresh() {
        if (this.appid === undefined || this.region === undefined || this.installDir === undefined) {
            dotenv.config();
            this.appid = process.env.APP_ID;
            this.region = process.env.REGION;
            this.installDir = process.env.DIRECTORY;;
        }
    }
}

Env.refresh();
module.exports = Env;

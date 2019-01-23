const rp = require('request-promise');
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'DEBUG';

class WoWsAPIClient {
    /**
     * @param {Object} wowsAPIConfig WoWsAPIConfigオブジェクト
     */
    static request(wowsAPIConfig) {
        return new Promise((resolve) => {
            rp({
                url: wowsAPIConfig.url,
                qs: wowsAPIConfig.qs,
            }).then((body) => {
                resolve(JSON.parse(body));
            }).catch((error) => {
                throw new Error(wowsAPIConfig.error);
            })
        });
    }
}

module.exports = WoWsAPIClient;
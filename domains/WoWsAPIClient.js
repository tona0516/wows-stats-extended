const rp = require('request-promise');

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
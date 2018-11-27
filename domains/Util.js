const Env = require('../domains/Env');

class Util {
    static joinByComma(list) {
        const tmp = [];
        for (const item of list) {
            tmp.push(item)
        }
        return tmp.join(',');
    }

    static isValid(data) {
        return data !== null && data !== undefined;
    }

    /**
     * WOWS-APIのURLを生成する
     *
     * @param {String} path
     */
    static generateApiUrl(path) {
        return 'https://api.worldofwarships.' + Env.region + '/wows' +  path;
    }
}

module.exports = Util;
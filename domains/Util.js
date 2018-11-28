const Env = require('./Env');

class Util {
    /**
     * 文字列のリストをコンマ区切りの文字列に変換する
     * 
     * @param {[String]} list 
     */
    static joinByComma(list) {
        const tmp = [];
        for (const item of list) {
            tmp.push(item)
        }
        return tmp.join(',');
    }

    /**
     * 有効なデータかを検証する
     * 
     * @param {Any} data 
     */
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
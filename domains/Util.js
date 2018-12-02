const rp = require('request-promise');

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

    /**
     * APIにリクエストする共通メソッド
     * 
     * @param {Object} option 
     * @param {Object} req 
     * @param {Object} res 
     */
    static requestCommon(option, req, res) {
        rp(option)
        .then(function(body) {
            res.send(body);
        })
        .catch(function(error) {
            logger.error(error);
            res.status(500);
            res.send(JSON.stringify({'error': error}));
        });
    }
}

module.exports = Util;
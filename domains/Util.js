const fs = require('fs')

const Env = require('./Env');
const Config = require('./Config');

const TIER_ROMAN = {
    1: "Ⅰ",
    2: "Ⅱ",
    3: "Ⅲ",
    4: "Ⅳ",
    5: "Ⅴ",
    6: "Ⅵ",
    7: "Ⅶ",
    8: "Ⅷ",
    9: "Ⅸ",
    10: "Ⅹ",
}

class Util {
    /**
     * ローマ数字を返却する
     * 
     * @param {number} number 
     */
    static romanNumber(number) {
        return TIER_ROMAN[number];
    }
}

module.exports = Util;
const TIER_ROMAN = {
  1: 'Ⅰ',
  2: 'Ⅱ',
  3: 'Ⅲ',
  4: 'Ⅳ',
  5: 'Ⅴ',
  6: 'Ⅵ',
  7: 'Ⅶ',
  8: 'Ⅷ',
  9: 'Ⅸ',
  10: 'Ⅹ'
}

class Util {
  /**
     * ローマ数字を返却する
     *
     * @param {Number} number 1~10の整数
     * @throws {Error}
     */
  static romanNumber (number) {
    if (number >= 1 && number <= 10 && Number.isInteger(number)) {
      return TIER_ROMAN[number]
    }
    throw new Error(`Invalid number: ${number}`)
  }
}

module.exports = Util

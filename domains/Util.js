class Util {
    static joinByComma(list) {
        const tmp = [];
        for (const item of list) {
            tmp.push(item)
        }
        return tmp.join(',');
    }
}

module.exports = Util;
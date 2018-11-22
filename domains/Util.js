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
}

module.exports = Util;
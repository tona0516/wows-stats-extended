const log4js = require('log4js');
const dotenv = require('dotenv');
var express = require('express');
var router = express.Router();

const logger = log4js.getLogger();
logger.level = 'DEBUG';

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('install', { title: 'インストール', isValid: null});
});

router.post('/', function(req, res, next) {
    const validateResult = validateParameter(req.body);
    if (validateResult.isValid) {
        saveParameter(req.body);
    }
    logger.debug(JSON.stringify(validateResult));
    res.render('install', { title: 'インストール', isValid: validateResult.isValid, message: validateResult.message});
});

const validateParameter = function(parameter) {
    const appid = parameter.appid;
    const directory = parameter.directory;

    if (!validateAppID(appid)) {
        return {isValid: false, message: 'Application IDもしくはサーバが不正です'};
    }
    if (!validateInstallDirectory(directory)) {
        return {isValid: false, message: 'インストール先が不正です'};;
    }
    return {isValid: true, message: null};
}

const validateAppID = function(appid) {
    // TODO サーバにリクエストしてデータが取得できるか確かめる
    return true;
}

const validateInstallDirectory = function(directory) {
    // TODO インストールディレクトリにexeがあるか検証する
    return false;
}

const saveParameter = function(parameter) {
    // dotenvに書き込む
}

module.exports = router;

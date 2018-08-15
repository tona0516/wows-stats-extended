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
    const isValid =  validateParameter(req.body) ? true : false;
    const message = isValid ? "登録完了" : "パラメータが無効です";

    res.render('install', { title: 'インストール', isValid: isValid, message: message});
});

const validateParameter = function(parameter) {
    const appid = parameter.appid;
    const region = parameter.region;
    const directory = parameter.directory;

    return true;
}

const validateAppID = function(appid) {

}

const validateInstallDirectory = function(directory) {

}

module.exports = router;

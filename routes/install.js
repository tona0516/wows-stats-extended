const log4js = require('log4js');
const dotenv = require('dotenv');
const request = require('request');
const fs = require('fs');
const async = require('async');
var express = require('express');
var router = express.Router();

const logger = log4js.getLogger();
logger.level = 'DEBUG';
dotenv.config();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('install', { title: 'インストール', isValid: null});
});

router.post('/', async function(req, res, next) {
    const validateResult = await validateParameter(req.body);
    if (validateResult.isValid) {
        saveParameter(req.body);
    }

    res.render('install', { title: 'インストール', isValid: validateResult.isValid, message: validateResult.message});
});

const validateParameter = async function(parameter) {
    const appid = parameter.appid;
    const region = parameter.region;
    const directory = parameter.directory;

    if (!await validateAppID(appid, region)) {
        return {isValid: false, message: 'Application IDが不正です'};
    }

    if (!validateInstallDirectory(directory)) {
        return {isValid: false, message: 'インストール先が不正です'};;
    }

    return {isValid: true, message: 'インストール完了！'};
}

const validateAppID = function(appid, region) {
    // サーバにリクエストしてデータが取得できるか確かめる
    return new Promise((resolve, reject) => {
        request.get({
            url: "https://api.worldofwarships." + region.toLowerCase() + "/wows/encyclopedia/info/",
            qs: {
                application_id: appid
            }
        }, function(error, response, body) {
            const json = JSON.parse(body);
            return json.status === 'ok' ? resolve(true) : resolve(false);
        });
    });
}

const validateInstallDirectory = function(directory) {
    return true;
    // インストールディレクトリにexeがあるか検証する
    try {
        fs.statSync(directory + '¥¥WorldOfWarships.exe');
        return true;
    } catch(err) {
        return false;
    }
}

const saveParameter = function(parameters) {
    // dotenvに書き込む
    const rows = {
        APP_ID: '"' + parameters.appid + '"',
        REGION: '"' + parameters.region.toLowerCase() + '"',
        DICRECTORY: '"' + parameters.directory + '"'
    };
    var list = []
    for (var key in rows) {
        list.push(key + "=" + rows[key]);
    }
    const contents = list.join('\n');
    fs.writeFileSync('.env', contents);
}

module.exports = router;

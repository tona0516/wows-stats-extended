const Env = require('./Env');
const Constants = require('./Constants');

const generateApiUrl = (path) => {
    return Constants.URL.WOWS_API + Env.region + '/' + Constants.PATH.WOWS_PATH + path;
}

module.exports = {
    fetch_account_id: {
        url: generateApiUrl('/account/list/'),
        qs: {
            application_id: Env.appid,
            // search: commaSeparatedPlayerName,
            type: "exact",
        },
        error: JSON.stringify({
            code: 5001,
            description: 'アカウントIDの取得に失敗しました',
        }),
    },
    fetch_personal_data: {
        url: generateApiUrl('/account/info/'),
        qs: {
            application_id: Env.appid,
            // account_id: commaSeparatedPlayerID,
            fields: 'hidden_profile,statistics'
        },
        error: JSON.stringify({
            code: 5002,
            description: 'プレイヤーデータの取得に失敗しました',
        }),
    },
    fetch_ship_statistics: {
        url: generateApiUrl('/ships/stats/'),
        qs: {
            application_id: Env.appid,
            // account_id: account_id,
            fields: 'pvp.frags,pvp.battles,pvp.survived_battles,pvp.damage_dealt,pvp.xp,pvp.wins,ship_id',
        },
        error: JSON.stringify({
            code: 5003,
            description: '鑑別成績の取得に失敗しました',
        }),
    },
    fetch_clan_id: {
        url: generateApiUrl('/clans/accountinfo/'),
        qs: {
            application_id: Env.appid,
            // account_id: commaSeparatedAccountID,
            fields: 'clan_id',
        },
        error: JSON.stringify({
            code: 5004,
            description: 'クランIDの取得に失敗しました',
        }),
    },
    fetch_clan_tag: {
        url: generateApiUrl('/clans/info/'),
        qs: {
            application_id: Env.appid,
            // clan_id: commaSeparatedClanID,
            fields: 'tag',
        },
        error: JSON.stringify({
            code: 5005,
            description: 'クランタグの取得に失敗しました',
        }),
    },
    fetch_game_version: {
        url: generateApiUrl('/encyclopedia/info/'),
        qs: {
            application_id: Env.appid,
            fields: "game_version",
            language: "ja",
        },
        error: JSON.stringify({
            code: 5006,
            description: 'ゲームバージョンの取得に失敗しました'
        }),
    },
    fetch_all_ships_info: {
        url: generateApiUrl('/encyclopedia/ships/'),
        qs: {
            application_id: Env.appid,
            fields: "name,tier,type,nation,default_profile.concealment.detect_distance_by_ship",
            // page_no: pageNo,
        },
        error: JSON.stringify({
            code: 5007,
            description: '艦種情報に失敗しました'
        }),
    },
};

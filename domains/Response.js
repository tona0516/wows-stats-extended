module.exports = {
    fetch_account_id_error: JSON.stringify({
        code: 5001,
        description: 'アカウントIDの取得に失敗しました'
    }),
    fetch_personal_data_error: JSON.stringify({
        code: 5002,
        description: 'プレイヤーデータの取得に失敗しました'
    }),
    fetch_ship_statistics_error: JSON.stringify({
        code: 5003,
        description: '鑑別成績の取得に失敗しました'
    }),
    fetch_clan_id_error: JSON.stringify({
        code: 5004,
        description: 'クランIDの取得に失敗しました'
    }),
    fetch_clan_tag_error: JSON.stringify({
        code: 5005,
        description: 'クランタグの取得に失敗しました'
    }),
    fetch_game_version_error: JSON.stringify({
        code: 5006,
        description: 'ゲームバージョンの取得に失敗しました'
    }),
    fetch_all_ships_info_error: JSON.stringify({
        code: 5007,
        description: '艦種情報に失敗しました'
    }),
};
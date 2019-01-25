var app = new Vue({
  el: '#app',
  data: {
    message: null,
    error: null,
    players: {},
  }
})

const FETCH_INTERVAL_MS = 1000;
var isFetching = false;
var isFirstFetch = true;

const Status = {
  NEED_NOT_FETCH: 1,
  FETCHING: 2,
  FETCH_FAIL: 3,
  FETCH_SUCCESS: 4,
}

/**
 * 共通リクエストメソッド
 * 
 * @param {String} url 
 * @param {Function} didLoad 
 * @param {String} method 
 */
const requestCommon = function (url, didLoad, method = 'GET') {
  const request = new XMLHttpRequest();
  request.open(method, url);
  request.addEventListener("load", (event) => {
    didLoad(event);
  });
  request.send();
}

/**
 * 新しい戦闘が始まったかをチェックする
 */
const checkUpdate = function () {
  return new Promise((resolve) => {
    requestCommon(DOMAIN + '/api/check_update', (event) => {
      resolve(event.target.status);
    });
  });
}

/**
 * 戦闘データを取得する
 */
const fetchData = function () {
  return new Promise((resolve, reject) => {
    requestCommon(DOMAIN + '/api/fetch', (event) => {
      const statusCode = event.target.status;
      const responseBody = event.target.responseText;
      const fetchedData = JSON.parse(responseBody);

      if (statusCode == 500) {
        return reject(fetchedData);
      }

      if (statusCode == 200) {
        return resolve(fetchedData);
      }
    });
  });
}

/**
 * 状態に応じてViewと変数を更新する
 * 
 * @param {Status} status 
 */
const updateStatus = function (status, players = null, error = null) {
  if (status === Status.NEED_NOT_FETCH) {
    app.message = '現在戦闘中ではありません。戦闘開始時に自動更新します。';
    return;
  }

  if (status === Status.FETCHING) {
    isFetching = true;
    app.message = "読み込み中...";
    return;
  }

  if (status === Status.FETCH_FAIL) {
    isFetching = false;
    isFirstFetch = false;
    app.message = null;
    app.error = "読み込みに失敗しました。もう一度お試しください: " + JSON.stringify(error);
    return;
  }

  if (status === Status.FETCH_SUCCESS) {
    isFetching = false;
    isFirstFetch = false;
    app.message = null;
    app.players = players;
    return;
  }
}

/**
 * 更新があるときに銭湯データを取得し反映する
 */
const fetchIfNeeded = async function () {
  // fetch中の時は新たにfetchしない
  if (isFetching) {
    return;
  }

  // 戦闘の更新チェック
  const status = await checkUpdate();

  // 戦闘中でない場合
  if (status == 299) {
    updateStatus(Status.NEED_NOT_FETCH, null, null);
    return;
  }

  // 新しい戦闘が開始された、もしくはユーザが画面をリロードした場合
  if (status == 200 || isFirstFetch) {
    updateStatus(Status.FETCHING, null, null);

    await fetchData().then((players) => {
      updateStatus(Status.FETCH_SUCCESS, players, null);
    })
    .catch((error) => {
      clearInterval(timer);
      updateStatus(Status.FETCH_FAIL, null, error);
    });
  }
}

timer = setInterval(fetchIfNeeded, FETCH_INTERVAL_MS);

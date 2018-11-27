var app = new Vue({
  el: '#app',
  data: {
    message: null,
    players: {},
  }
})

const DOMAIN = 'http://localhost:3000';
var isFetching = false;
var isFirstFetch = true;

const fetchShipConcealment = function() {
  return new Promise((resolve) => {
    var request = new XMLHttpRequest();
    request.open("GET", DOMAIN + '/external_api/info/ship_concealment');
    request.addEventListener("load", (event) => {
      resolve();
    });
    request.send();
  })
}

const checkUpdate = function() {
  return new Promise((resolve) => {
    var request = new XMLHttpRequest();
    request.open("GET", DOMAIN + '/external_api/check_update');
    request.addEventListener("load", (event) => {
      resolve(event.target.status);
    });
    request.send();
  });
}

const fetch = function() {
  return new Promise((resolve, reject) => {
    var request = new XMLHttpRequest();
    request.open("GET", DOMAIN + '/external_api/fetch');
    request.addEventListener("load", (event) => {
      const statusCode = event.target.status;
      const responseBody = event.target.responseText;
      const fetchedData = JSON.parse(responseBody);

      if (statusCode == 500) {
        return reject(fetchedData.error);
      }

      if (statusCode == 200) {
        app.players = fetchedData;
        return resolve();
      }
    });
    request.send();
  });
}

const fetchIfNeeded = async function() {
  // fetch中の時は新たにfetchしない
  if (isFetching) {
    return;
  }

  // 戦闘の更新チェック
  const status = await checkUpdate();

  // 戦闘中でない場合
  if (status == 299) {
    app.message = '現在戦闘中ではありません。戦闘開始時に自動更新します。';
    return;
  }

  // 新しい戦闘が開始された、もしくはユーザが画面をリロードした場合
  if (status == 200 || isFirstFetch) {
    isFetching = true;
    app.message = "読み込み中...";

    await fetch().catch((error) => {
      isFetching = false;
      isFirstFetch = false;
      app.message = "読み込みに失敗しました。もう一度お試しください: " + error;
      return;
    });

    isFetching = false;
    isFirstFetch = false;
    app.message = null;
    return;
  }
}

// fetchShipConcealment();
setInterval(fetchIfNeeded, 1000);

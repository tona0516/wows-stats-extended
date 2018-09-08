var app = new Vue({
  el: '#app',
  data: {
    message: null,
    players: {},
    images: {},
    nations: {}
  }
})

const DOMAIN = 'http://localhost:3000';
var isFetching = false;
var cache = null;

const fetchImage = function () {
  var request = new XMLHttpRequest();
  request.open("GET", DOMAIN + '/apis/info/encyclopedia');
  request.addEventListener("load", (event) => {
    const statusCode = event.target.status;
    const responseBody = event.target.responseText;
    const json = JSON.parse(responseBody);

    if (statusCode == 500) {
      return;
    }
      
    if (event.target.status == 200) {
      const data = json.data;
      app.images = data.ship_type_images;
      app.nations = data.ship_nations;
      return;
    }
  });
  request.send();
}

const checkUpdate = function() {
  return new Promise((resolve) => {
    var request = new XMLHttpRequest();
    request.open("GET", DOMAIN + '/apis/check_update');
    request.addEventListener("load", (event) => {
      resolve(event.target.status);
    });
    request.send();
  });
}

const fetch = function () {
  return new Promise((resolve, reject) => {
    var request = new XMLHttpRequest();
    request.open("GET", DOMAIN + '/apis/fetch');
    request.addEventListener("load", (event) => {
      const statusCode = event.target.status;
      const responseBody = event.target.responseText;
      const json = JSON.parse(responseBody);

      if (statusCode == 500) {
        return reject(json.error);
      }

      if (statusCode == 200) {
        app.players = json;
        cache = responseBody;
        return resolve();
      }
    });
    request.send();
  });
}

const fetchCache = function () {
  return new Promise((resolve, reject) => {
    var request = new XMLHttpRequest();
    request.open("GET", DOMAIN + '/apis/fetch_cache');
    request.addEventListener("load", (event) => {
      const statusCode = event.target.status;
      const responseBody = event.target.responseText;
      const json = JSON.parse(responseBody);

      if (statusCode == 500) {
        return reject(json.error)
      }

      if (statusCode == 200) {
        if (cache !== responseBody) {
          app.players = json;
        }
        return resolve();
      }
    });
    request.send();
  });
}

const fetchIfNeeded = async function() {
  if (isFetching) {
    return;
  }

  const status = await checkUpdate();

  if (status == 299) {
    app.message = '現在戦闘中ではありません。戦闘開始時に自動更新します。';
    return;
  }

  if (status == 209) {
    await fetchCache().catch((error) => {
      app.message = "読み込みに失敗しました。もう一度お試しください: " + error;
      return;
    });

    app.message = null;
    return;
  }

  if (status == 200) {
    isFetching = true;
    app.message = "読み込み中...";

    await fetch().catch((error) => {
      isFetching = false;
      app.message = "読み込みに失敗しました。もう一度お試しください: " + error;
      return;
    });

    isFetching = false;
    app.message = null;
    return;
  }
}

fetchImage();
setInterval(fetchIfNeeded, 1000);


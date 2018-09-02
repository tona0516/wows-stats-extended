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
const FAKE_LOADER_TIMEOUT = 20 * 1000;
var isFetching = false;
var cache = null;

var fetchImage = function () {
  var imageRequest = new XMLHttpRequest();
  imageRequest.open("GET", DOMAIN + '/apis/info/encyclopedia');
  imageRequest.addEventListener("load", (event) => {
    if (event.target.status == 200) {
      const json = JSON.parse(event.target.responseText);
      const data = json.data;
      app.images = data.ship_type_images;
      app.nations = data.ship_nations;
    } else {
      app.images = null;
      app.nations = null;
    }
  });
  imageRequest.send();
}

var checkUpdate = function() {
  return new Promise((resolve) => {
    var request = new XMLHttpRequest();
    request.open("GET", DOMAIN + '/apis/check_update');
    request.addEventListener("load", (event) => {
      resolve(event.target.status);
    });
    request.send();
  });
}

var fetch = function () {
  return new Promise((resolve) => {
    var request = new XMLHttpRequest();
    request.open("GET", DOMAIN + '/apis/fetch');
    request.addEventListener("load", (event) => {
      const statusCode = event.target.status;
      const responseBody = event.target.responseText;
      if (statusCode == 200) {
        const json = JSON.parse(responseBody);
        app.players = json;
        cache = responseBody;
      }
      resolve();
    });
    request.send();
  });
}

var fetchCache = function () {
  return new Promise((resolve) => {
    var request = new XMLHttpRequest();
    request.open("GET", DOMAIN + '/apis/fetch_cache');
    request.addEventListener("load", (event) => {
      const statusCode = event.target.status;
      const responseBody = event.target.responseText;
      if (statusCode == 200) {
        if (cache !== responseBody) {
          const json = JSON.parse(responseBody);
          app.players = json;
        }
      }
      resolve();
    });
    request.send();
  });
}

var fetchIfNeeded = async function() {
  if (isFetching) {
    return;
  }

  const status = await checkUpdate();

  if (status == 299) {
    app.message = '現在戦闘中ではありません。戦闘開始時に自動更新します。';
    return;
  }

  if (status == 209) {
    await fetchCache();
    app.message = null;
    return;
  }

  if (status == 200) {
    isFetching = true;
    app.message = "読み込み中...";

    await fetch();

    isFetching = false;
    app.message = null;
    return;
  }
}

fetchImage();
setInterval(fetchIfNeeded, 1000);


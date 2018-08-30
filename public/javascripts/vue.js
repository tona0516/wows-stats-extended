var app = new Vue({
  el: '#app',
  data: {
    players: {},
    images: {},
    nations: {},
    tier: {}
  }
})

const DOMAIN = 'http://localhost:3000';
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

var fetchTier = function (pageNo, json, callback) {
  var request = new XMLHttpRequest();
  request.open("GET", DOMAIN + '/apis/info/ship_tier?page_no=' + pageNo);
  request.addEventListener("load", (event) => {
    const statusCode = event.target.status;
    if (statusCode == 209) {
      const newJson = JSON.parse(event.target.responseText);
      for (var id in newJson) {
        json[id] = newJson[id];
      }
      fetchTier(pageNo + 1, json, callback);
    } else {
      statusCode == 200 ? callback(json, false) : callback(json, true);
    }
  })
  request.send();
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

  if (status == 209) {
    await fetchCache();
    return;
  }

  if (status == 200) {
    isFetching = true;
    await fetch();
    isFetching = false;
    return;
  }
}

fetchImage();
fetchTier(1, {}, function (json, isError) {
  if (!isError) {
    app.tier = json;
  }
});
setInterval(fetchIfNeeded, 1000);


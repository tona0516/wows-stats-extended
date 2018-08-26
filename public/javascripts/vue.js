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

fetchImage();
fetchTier(1, {}, function (json, isError) {
  if (!isError) {
    app.tier = json;
  }
});

var request = null;
var lastResponseBody = null;
var fetch = function () {
  if (request != null) {
    return;
  }

  request = new XMLHttpRequest();
  request.open("GET", DOMAIN + '/apis/fetch');
  request.addEventListener("load", (event) => {
    const statusCode = event.target.status;
    const responseBody = event.target.responseText;
    if (statusCode == 200 || (statusCode == 209 && lastResponseBody != null && lastResponseBody != responseBody)) {
      const json = JSON.parse(responseBody);
      app.players = json;
      lastResponseBody = responseBody;
    }
    request = null;
  });
  request.send();
}
setInterval(fetch, 1000);


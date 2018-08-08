var app = new Vue({
  el: '#app',
  data: {
    friends: [],
    enemies: [],
    images: []
  }
})

var fetchImage = function () {
  var imageRequest = new XMLHttpRequest();
  imageRequest.open("GET", 'http://localhost:3000/apis/info/ship/image');
  imageRequest.addEventListener("load", (event) => {
    if (event.target.status == 200) {
      app.images = JSON.parse(event.target.responseText);
    } else {
      app.images = null;
    }
  });
  imageRequest.send();
}
fetchImage();

var request = null;
var lastResponseBody = null;
var fetch = function () {
  if (request == null) {
    request = new XMLHttpRequest();
    request.open("GET", 'http://localhost:3000/apis/fetch');
    request.addEventListener("load", (event) => {
      const statusCode = event.target.status;
      const responseBody = event.target.responseText;
      if (statusCode == 200 || (statusCode = 201 && lastResponseBody != null && lastResponseBody != responseBody)) {
        const json = JSON.parse(responseBody);
        app.friends = json.friends.sort(sort_by_type_and_tier());
        app.enemies = json.enemies.sort(sort_by_type_and_tier());
        lastResponseBody = responseBody;
      }
      request = null;
    });
    request.send();
  }
}
setInterval(fetch, 1000);

var sort_by_type_and_tier = function () {
  return function (a, b) {
    var a_type = a.ship_info.type;
    var b_type = b.ship_info.type;
    a_type = a_type.toUpperCase();
    b_type = b_type.toUpperCase();
    if (a_type < b_type) return -1;
    if (a_type > b_type) return 1;
    if (a_type == b_type) {
      var a_tier = a.ship_info.tier;
      var b_tier = b.ship_info.tier;
      a_tier = parseInt(a_tier);
      b_tier = parseInt(b_tier);
      if (a_tier < b_tier) return 1;
      if (a_tier > b_tier) return -1;
    }
    return 0;
  }
}

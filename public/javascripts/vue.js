var app = new Vue({
  el: '#app',
  data: {
    friends: [],
    enemies: [],
    images: [],
    nations: []
  }
})

var fetchImage = function () {
  var imageRequest = new XMLHttpRequest();
  imageRequest.open("GET", 'http://localhost:3000/apis/info/encyclopedia');
  imageRequest.addEventListener("load", (event) => {
    if (event.target.status == 200) {
      const json = JSON.parse(event.target.responseText);
      app.images = json.ship_type_images;
      app.nations = json.ship_nations;
    } else {
      app.images = null;
      app.nations = null;
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
        app.friends = json.friends;
        app.enemies = json.enemies;
        lastResponseBody = responseBody;
      }
      request = null;
    });
    request.send();
  }
}
setInterval(fetch, 1000);


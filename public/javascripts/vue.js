var app = new Vue({
  el: '#app',
  data: {
    message: 'null'
  }
})

var count = 0;
var request = null;
var fetch = function() {
  if (!request) {
    request = new XMLHttpRequest();
    request.open("GET", 'http://localhost:3000/apis/fetch');
    request.addEventListener("load", (event) => {
      if (event.target.status == 200) {
        app.message = event.target.responseText;
      }
      request = null;
    });
    request.send();
  }
}
setInterval(fetch, 1000);

/** @format */

let app = document.getElementById('app');
if (app) {
   let thisApp = app;
   thisApp.innerText = 'Hello World!!';

   let baseURI = document.baseURI.substr(location.protocol.length);
   if (location.protocol === 'http:') {
      baseURI = 'ws:' + baseURI;
   } else {
      baseURI = 'wss:' + baseURI;
   }
   let ws = new WebSocket(baseURI + 'ws');
   ws.onopen = function () {
      ws.send('Init');
   };
   // tslint:disable-next-line: typedef
   ws.onmessage = function (event) {
      let div = document.createElement('div');
      div.appendChild(
         document.createTextNode(event.data));
      thisApp.appendChild(div);
   };
}

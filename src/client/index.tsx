/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import ServerFunc from '../shared/ServerFunc';
import Message from '../shared/Message';
import ClientFunc from '../shared/ClientFunc';

let app = document.getElementById('app');
if (app) {
   let thisApp = app;
   thisApp.innerText = 'Hello World!';

   let baseURI = document.baseURI.substr(location.protocol.length);
   if (location.protocol === 'http:') {
      baseURI = 'ws:' + baseURI;
   } else {
      baseURI = 'wss:' + baseURI;
   }

   Server.init(baseURI + 'ws', new Message.String('Was?'), Message.String)
      .then(p => console.log('Init-Result: ' + p.data));

   let button = document.createElement('button');
   app.appendChild(button);
   button.innerText = 'Click';
   button.onclick = async () => {
      Server.post(ServerFunc.Click, new Message.Time(new Date()));
      console.log(await Server.getString(ServerFunc.Init, new Message.String('Test')));
   };

   Server.on(ClientFunc.ClickFromClient, (data, _) => {
      console.log('Click', data);
   });
   Server.on(ClientFunc.Hello, (data, _) => {
      console.log('Hello', data);
   });
   Server.on(ClientFunc.ClickFromClient, (data, _) => {
      console.log('Click2', data);
   });
}
// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

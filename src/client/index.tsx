/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import { ServerFunction } from '../shared/ServerFunc.js';
import Message from '../shared/Message';
import { ClientMethod } from '../shared/ClientFunc.js';

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
      Server.post(ServerFunction.Click, new Message.Time(new Date()));
      console.log(await Server.getString(ServerFunction.Init, new Message.String('Test')));
   };

   Server.on(ClientMethod.ClickFromClient, Message.Time, (msg) => {
      console.log('Click', msg.data);
   });
   Server.on(ClientMethod.Hello, Message.String, (msg) => {
      console.log('Hello', msg.data);
   });
   Server.on(ClientMethod.ClickFromClient, Message.Time, (msg) => {
      console.log('Click2', msg.data);
   });
}
// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import { ServerFunction, ClientMethod } from '../shared/Functions.js';
import Message from '../shared/Message';

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
      .then(p => console.log('Init-Result: :' + p.data + ':'));

   let button = document.createElement('button');
   app.appendChild(button);
   button.innerText = 'Click';
   button.onclick = async () => {
      Server.post(ServerFunction.Click, new Message.Time(new Date()));
      console.log(await Server.getString(ServerFunction.Init, new Message.String('Test')));
   };

   Server.onMethod(ClientMethod.ClickFromClient, Message.Time, (msg) => {
      console.log('Click', msg.data);
   });
   Server.onMethod(ClientMethod.Hello, Message.String, (msg) => {
      console.log('Hello', msg.data);
   });
   Server.onMethod(ClientMethod.ClickFromClient, Message.Time, (msg) => {
      console.log('Click2', msg.data);
   });
}
// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

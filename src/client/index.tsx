/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import { ServerFunction, ClientFunction } from '../shared/Functions.js';
import { Time, Text } from '../shared/Message.js';
import MsgInit from '../shared/Messages/MsgInit';

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

   let msgInit = new MsgInit();
   msgInit.url = location.href;
   msgInit.browser = navigator.userAgent;
   msgInit.time = new Date();

   Server.init(baseURI + 'ws', msgInit)
      .then(p => console.log('Init-Result: :' + p.data + ':'));

   let button = document.createElement('button');
   app.appendChild(button);
   button.innerText = 'Click';
   button.onclick = async () => {
      Server.call(ServerFunction.Click, new Time(new Date()));
   };

   Server.on(ClientFunction.ClickFromClient, (msg) => {
      console.log('Click', msg.data);
   });
   Server.on(ClientFunction.Hello, (msg) => {
      console.log('Hello', msg.data);
   });
   Server.on(ClientFunction.ClickFromClient, async (msg) => {
      console.log('Click2', msg.data);
      try {
         console.log('length = ' + (await Server.call(ServerFunction.Cool, new Text('Mein Name'))).data);
      } catch (reason) {
         console.error(reason);
      }
   });
}
// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

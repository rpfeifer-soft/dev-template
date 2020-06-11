/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import { ServerFunction, ClientFunction } from '../shared/Functions.js';
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
      .then(p => console.log('Init-Result: :' + p + ':'));

   let button = document.createElement('button');
   app.appendChild(button);
   button.innerText = 'Click';
   button.onclick = async () => {
      Server.call(ServerFunction.Click, new Date());
   };

   Server.on(ClientFunction.ClickFromClient, (date) => {
      console.log('Click', date);
   });
   Server.on(ClientFunction.Hello, (text) => {
      console.log('Hello', text);
   });
   Server.on(ClientFunction.ClickFromClient, async (date) => {
      console.log('Click2', date);
      try {
         console.log('length = ' + (await Server.call(ServerFunction.Cool, 'Mein Name')));
      } catch (reason) {
         console.error(reason);
      }
   });
}
// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

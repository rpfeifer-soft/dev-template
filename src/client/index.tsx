/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import { ServerFunction, ClientFunction } from '../shared/Functions.js';
import Init from '../shared/Messages/Init';

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

   Server.init(baseURI + 'ws', new Init(location.href, navigator.userAgent, new Date()))
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

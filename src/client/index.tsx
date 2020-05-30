/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import { ServerFunc } from '../shared/ServerFunc';
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

   Server.init(baseURI + 'ws');

   let button = document.createElement('button');
   app.appendChild(button);
   button.innerText = 'Click';
   button.onclick = () => {
      Server.post(ServerFunc.Click, new Message.Time(new Date()));
   };
}
// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

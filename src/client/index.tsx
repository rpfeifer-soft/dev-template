/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import { ServerFunction, ClientMethod } from '../shared/Functions.js';
import { Time, Text } from '../shared/Message.js';

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

   Server.init(baseURI + 'ws', new Text('Was?'))
      .then(p => console.log('Init-Result: :' + p.data + ':'));

   let button = document.createElement('button');
   app.appendChild(button);
   button.innerText = 'Click';
   button.onclick = async () => {
      Server.call(ServerFunction.Click, new Time(new Date()));
      console.log(await (await Server.call(ServerFunction.Init, new Text('Test'))).data);
   };

   Server.on(ClientMethod.ClickFromClient, (msg) => {
      console.log('Click', msg.data);
   });
   Server.on(ClientMethod.Hello, (msg) => {
      console.log('Hello', msg.data);
   });
   Server.on(ClientMethod.ClickFromClient, async (msg) => {
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

/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import { ServerFunction, ClientFunction } from '../shared/Functions.js';
import ConnectInfo from '../shared/Data/ConnectInfo';
import ClientInfo from '../shared/Data/ClientInfo';

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

   let versionNode = document.querySelector('meta[name="version"]');

   let connectInfo = new ConnectInfo();
   connectInfo.browser = navigator.userAgent;
   connectInfo.time = new Date();
   connectInfo.version = versionNode ? (versionNode.getAttribute('content') || '') : '';

   Server.init(baseURI + 'ws', connectInfo)
      .then(p => console.log('Init-Result', p))
      .catch(error => console.error(error));

   let button = document.createElement('button');
   app.appendChild(button);
   button.innerText = 'Click';
   button.onclick = async () => {
   };

   Server.on(ClientFunction.ClientChanged, async (client: ClientInfo) => {
      console.log('add', client.id);
      let infos = await Server.call(ServerFunction.GetClientInfos);
      console.log(infos);
   });
   Server.on(ClientFunction.ClientsRemoved, async (ids: number[]) => {
      console.log('removed', ids);
      let infos = await Server.call(ServerFunction.GetClientInfos);
      console.log(infos);
   });
}
// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

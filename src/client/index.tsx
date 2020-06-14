/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import ConnectInfo from '../shared/Data/ConnectInfo';
import initApp from './App/App.js';

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
      .then(clientInfo => initApp(clientInfo))
      .catch(error => console.error(error));
}
// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

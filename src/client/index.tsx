/** @format */

import registerServiceWorker from './registerServiceWorker';
import Server from './Server.js';
import ConnectInfo from '../shared/Data/ConnectInfo';
import initApp from './App/App.js';

function uuidv4() {
   return (String([1e7]) + String(-1e3) + String(-4e3) + String(-8e3) + String(-1e11))
      .replace(/[018]/g, c =>
         (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
      );
}

function getSessionId() {
   let sessionId = localStorage.getItem('SessionId');
   if (!sessionId) {
      // Create a new session id
      sessionId = uuidv4();
      localStorage.setItem('SessionId', sessionId);
   }
   return sessionId;
}

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
   connectInfo.sessionId = getSessionId();
   connectInfo.browser = navigator.userAgent;
   connectInfo.time = new Date();
   connectInfo.version = versionNode ? (versionNode.getAttribute('content') || '') : '';

   Server.init(baseURI + 'ws', connectInfo)
      .then(clientInfo => initApp(clientInfo))
      .catch(error => console.error(error));
}
// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

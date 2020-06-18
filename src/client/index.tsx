/** @format */

import { register as registerServiceWorker } from './registerServiceWorker';
import { server } from './server.js';
import { ConnectInfo } from '../shared/data/ConnectInfo.js';
import { app } from './app/app.js';
import { registerDebug } from './app/registerDebug.js';

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

let baseURI = document.baseURI.substr(location.protocol.length);
if (location.protocol === 'http:') {
   baseURI = 'ws:' + baseURI;
} else {
   baseURI = 'wss:' + baseURI;
}

let versionNode = document.querySelector('meta[name="version"]');
let connectInfo = new ConnectInfo(
   getSessionId(), versionNode ? (versionNode.getAttribute('content') || '') : '');
connectInfo.browser = navigator.userAgent;
connectInfo.time = new Date();

server.init(baseURI + 'ws', connectInfo)
   .then(info => app.onInit(info))
   .catch(error => console.error(error));

// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

// Allow to access the app here
registerDebug('app', () => app);
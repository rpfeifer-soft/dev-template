/** @format */

import { register as registerServiceWorker } from './registerServiceWorker';
import { server } from './server.js';
import { ConnectInfo } from '../shared/data/ConnectInfo.js';
import { app } from './app/app.js';
import { registerDebug } from './registerDebug.js';

let baseURI = document.baseURI.substr(location.protocol.length);
if (location.protocol === 'http:') {
   baseURI = 'ws:' + baseURI;
} else {
   baseURI = 'wss:' + baseURI;
}

let versionNode = document.querySelector('meta[name="version"]');
let connectInfo = ConnectInfo.create({
   version: versionNode ? (versionNode.getAttribute('content') || '') : '',
   browser: navigator.userAgent,
   language: app.language,
   sessionId: app.sessionId,
   userName: app.userName
});

server.init(baseURI + 'ws', connectInfo)
   .then(info => app.onInit(info))
   .catch(error => console.error(error));

// tslint:disable-next-line: no-string-literal
registerServiceWorker(window['isProduction'], '');

// Allow to access the app here
registerDebug('app', () => app);

/** @format */

import { register as registerServiceWorker } from './registerServiceWorker';
import { server } from './server.js';
import { ConnectInfo } from '../shared/data/ConnectInfo.js';
import { app } from './app/app.js';
import { registerDebug } from './registerDebug.js';

let baseURI = document.baseURI.slice(location.protocol.length);
baseURI = location.protocol === 'http:' ? 'ws:' + baseURI : 'wss:' + baseURI;

const versionNode = document.querySelector('meta[name="version"]');
const connectInfo = ConnectInfo.create({
   version: versionNode ? (versionNode.getAttribute('content') || '') : '',
   browser: navigator.userAgent,
   language: app.language,
   sessionId: app.sessionId,
   userName: app.userName
});

server.init(baseURI + 'ws', connectInfo)
   .then(info => app.onInit(info))
   // eslint-disable-next-line no-console
   .catch(error => console.error(error));

// eslint-disable-next-line @typescript-eslint/dot-notation
registerServiceWorker(window['isProduction'], '');

// Allow to access the app here
registerDebug('app', () => app);

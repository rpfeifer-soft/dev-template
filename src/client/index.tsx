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

function init() {
   // Init the server
   server.init(baseURI + 'ws', connectInfo)
      .then(info => app.onInit(info))
      // eslint-disable-next-line no-console
      .catch(error => console.error(error));
}

init();

// Set the name of the hidden property and the change event for visibility
let hidden: string;
let visibilityChange = '';
if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support 
   hidden = 'hidden';
   visibilityChange = 'visibilitychange';
   // eslint-disable-next-line @typescript-eslint/dot-notation
} else if (typeof document['msHidden'] !== 'undefined') {
   hidden = 'msHidden';
   visibilityChange = 'msvisibilitychange';
   // eslint-disable-next-line @typescript-eslint/dot-notation
} else if (typeof document['webkitHidden'] !== 'undefined') {
   hidden = 'webkitHidden';
   visibilityChange = 'webkitvisibilitychange';
}

if (visibilityChange) {
   document.addEventListener(visibilityChange, () => {
      if (!document[hidden] && !server.isConnected()) {
         // reinit
         init();
      }
   });
}

// eslint-disable-next-line @typescript-eslint/dot-notation
registerServiceWorker(window['isProduction'], document.baseURI.replace(/\/$/g, ''));

// Allow to access the app here
registerDebug('app', () => app);

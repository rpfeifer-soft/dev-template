/** @format */

import { createJsonFactory, jsonDateSerializer } from '../serialize/factories.js';
import { Language } from '../types.js';

interface IConnectInfo {
   sessionId: string;
   version: string;
   authKey?: string;
   userName?: string;
   language?: Language;
   browser?: string;
   time?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ConnectInfo extends IConnectInfo { }
class ConnectInfo {
   constructor(sessionId: string, version: string) {
      this.sessionId = sessionId;
      this.version = version;
   }
}
export { ConnectInfo };

export const fConnectInfo = createJsonFactory<ConnectInfo, IConnectInfo>(
   () => new ConnectInfo('', ''), {
   sessionId: true,
   version: true,
   authKey: true,
   userName: true,
   language: true,
   browser: true,
   time: jsonDateSerializer
});

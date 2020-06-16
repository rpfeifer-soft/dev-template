/** @format */

import createJsonFactory, { jsonDateSerializer } from '../msg/JsonFactory.js';
import { Language } from '../msg/Types.js';

interface IConnectInfo {
   sessionId: string;
   version: string;
   authKey?: string;
   userName?: string;
   language?: Language;
   browser?: string;
   time?: Date;
}

interface ConnectInfo extends IConnectInfo { };
class ConnectInfo {
   constructor(sessionId: string, version: string) {
      this.sessionId = sessionId;
      this.version = version;
   }
};
export default ConnectInfo;

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

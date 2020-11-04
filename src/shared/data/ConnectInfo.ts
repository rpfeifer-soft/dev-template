/** @format */

import { createBinaryFactory } from '../serialize/factories.js';
import { ByteArray } from '../serialize/ByteArray.js';
import { Language } from '../types.js';

interface IConnectInfo {
   version: string;
   browser: string;
   language?: Language;
   sessionId: string;
   userName?: string;
}

class ConnectInfo implements IConnectInfo {
   version: string;
   browser: string;
   language?: Language;
   sessionId: string;
   userName?: string;

   private constructor() {
      // Do not allow to create the object via new - use create instead
   }

   static create(info: IConnectInfo): ConnectInfo {
      const connectInfo = new ConnectInfo();
      connectInfo.version = info.version;
      connectInfo.browser = info.browser;
      connectInfo.language = info.language;
      connectInfo.sessionId = info.sessionId;
      connectInfo.userName = info.userName;
      return connectInfo;
   }

   // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
   static getFactory() {
      return createBinaryFactory<ConnectInfo>(() => new ConnectInfo(),
         (bytes: ByteArray, data: ConnectInfo, opt: (key: string) => void) => {
            data.readFrom(bytes, opt);
         },
         (data: ConnectInfo, bytes: ByteArray) => {
            data.writeTo(bytes);
         });
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   readFrom(bytes: ByteArray, opt: (key: string) => void): void {
      this.version = bytes.getString() || '';
      this.browser = bytes.getString() || '';
      this.language = bytes.getNumber(); opt('language');
      this.sessionId = bytes.getString() || '';
      this.userName = bytes.getString(); opt('userName');
   }

   writeTo(bytes: ByteArray): void {
      bytes.addString(this.version);
      bytes.addString(this.browser);
      bytes.addNumber(this.language);
      bytes.addString(this.sessionId);
      bytes.addString(this.userName);
   }

}
const fConnectInfo = ConnectInfo.getFactory();

export { ConnectInfo, fConnectInfo };

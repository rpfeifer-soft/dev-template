/** @format */

import { createBinaryFactory } from '../serialize/factories.js';
import { ByteArray } from '../serialize/ByteArray.js';
import { ConnectInfo } from './data.js';

class ClientInfo {
   id: number;
   startTime: Date;
   version: string;
   browser: string;

   connect(info: ConnectInfo) {
      this.version = info.version;
      this.browser = info.browser;
   }

   set(info: ClientInfo) {
      this.id = info.id;
      this.startTime = info.startTime;
      this.version = info.version;
      this.browser = info.browser;
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   readFrom(bytes: ByteArray, opt: (key: string) => void): void {
      this.id = bytes.getNumber() || 0;
      this.startTime = bytes.getDate() || new Date();
      this.version = bytes.getString() || '';
      this.browser = bytes.getString() || '';
   }

   writeTo(bytes: ByteArray): void {
      bytes.addNumber(this.id);
      bytes.addDate(this.startTime);
      bytes.addString(this.version);
      bytes.addString(this.browser);
   }

   getFactory() {
      return createBinaryFactory<ClientInfo>(() => new ClientInfo(),
         (bytes: ByteArray, data: ClientInfo, opt: (key: string) => void) => {
            data.readFrom(bytes, opt);
         },
         (data: ClientInfo, bytes: ByteArray) => {
            data.writeTo(bytes);
         });
   }
}
export { ClientInfo };
/** @format */

import { createBinaryFactory } from '../serialize/factories.js';
import { ByteArray } from '../serialize/ByteArray.js';

class ConnectInfo {
   browser: string;
   version: string;

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   readFrom(bytes: ByteArray, opt: (key: string) => void): void {
      this.browser = bytes.getString() || '';
      this.version = bytes.getString() || '';
   }

   writeTo(bytes: ByteArray): void {
      bytes.addString(this.browser);
      bytes.addString(this.version);
   }

   getFactory() {
      return createBinaryFactory<ConnectInfo>(() => new ConnectInfo(),
         (bytes: ByteArray, data: ConnectInfo, opt: (key: string) => void) => {
            data.readFrom(bytes, opt);
         },
         (data: ConnectInfo, bytes: ByteArray) => {
            data.writeTo(bytes);
         });
   }
}
export { ConnectInfo };

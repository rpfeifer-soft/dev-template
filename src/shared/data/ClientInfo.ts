/** @format */

import { createBinaryFactory } from '../serialize/factories.js';
import { ByteArray } from '../serialize/ByteArray.js';
import { ConnectInfo } from './ConnectInfo.js';
import { Language, UserRole } from '../types.js';

class ClientInfo {
   id: number;
   startTime: Date;
   version: string;
   browser: string;
   language: Language;
   sessionId: string;
   userName: string;
   userRole: UserRole;

   private constructor() {
      // Do not allow to create the object via new - use create instead
   }

   static connect(connectInfo: ConnectInfo): ClientInfo {
      const clientInfo = new ClientInfo();
      clientInfo.version = connectInfo.version;
      clientInfo.browser = connectInfo.browser;
      clientInfo.language = connectInfo.language || Language.German;
      clientInfo.sessionId = connectInfo.sessionId;
      clientInfo.userName = connectInfo.userName || '';
      clientInfo.userRole = UserRole.Guest;
      return clientInfo;
   }

   static copy(info: ClientInfo) {
      const clientInfo = new ClientInfo();
      clientInfo.set(info);
      return clientInfo;
   }

   static getFactory() {
      return createBinaryFactory<ClientInfo>(() => new ClientInfo(),
         (bytes: ByteArray, data: ClientInfo, opt: (key: string) => void) => {
            data.readFrom(bytes, opt);
         },
         (data: ClientInfo, bytes: ByteArray) => {
            data.writeTo(bytes);
         });
   }

   set(info: ClientInfo) {
      this.id = info.id;
      this.startTime = info.startTime;
      this.version = info.version;
      this.browser = info.browser;
      this.language = info.language;
      this.sessionId = info.sessionId;
      this.userName = info.userName;
      this.userRole = info.userRole;
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   readFrom(bytes: ByteArray, opt: (key: string) => void): void {
      this.id = bytes.getNumber() || 0;
      this.startTime = bytes.getDate() || new Date();
      this.version = bytes.getString() || '';
      this.browser = bytes.getString() || '';
      this.language = bytes.getNumber() || Language.German;
      this.sessionId = bytes.getString() || '';
      this.userName = bytes.getString() || '';
      this.userRole = bytes.getNumber() || UserRole.Guest;
   }

   writeTo(bytes: ByteArray): void {
      bytes.addNumber(this.id);
      bytes.addDate(this.startTime);
      bytes.addString(this.version);
      bytes.addString(this.browser);
      bytes.addNumber(this.language);
      bytes.addString(this.sessionId);
      bytes.addString(this.userName);
      bytes.addNumber(this.userRole);
   }
}
const fClientInfo = ClientInfo.getFactory();

export { ClientInfo, fClientInfo };
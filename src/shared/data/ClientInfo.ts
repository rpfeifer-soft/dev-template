/** @format */

import { createBinaryFactory } from '../serialize/factories.js';
import { ByteArray } from '../serialize/ByteArray.js';
import { ConnectInfo } from './ConnectInfo.js';
import { Language, UserRole } from '../types.js';

interface IClientInfo {
   id: number;
   startTime: Date;
   version: string;
   browser: string;
   language: Language;
   sessionId: string;
   userName: string;
   userRole: UserRole;
}
class ClientInfo implements IClientInfo {
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

   static copy(info: IClientInfo) {
      const clientInfo = new ClientInfo();
      ClientInfo.set(clientInfo, info);
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

   static set(clientInfo: IClientInfo, info: IClientInfo) {
      clientInfo.id = info.id;
      clientInfo.startTime = info.startTime;
      clientInfo.version = info.version;
      clientInfo.browser = info.browser;
      clientInfo.language = info.language;
      clientInfo.sessionId = info.sessionId;
      clientInfo.userName = info.userName;
      clientInfo.userRole = info.userRole;
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
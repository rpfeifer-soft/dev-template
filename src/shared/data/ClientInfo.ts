/** @format */

import { createJsonFactory, jsonDateSerializer } from '../serialize/factories.js';
import { UserRole, Language } from '../types.js';
import { ConnectInfo } from './ConnectInfo.js';

interface IClientInfo extends Omit<Required<ConnectInfo>, 'authKey' | 'time'> {
   id: number;
   userName: string;
   userRole: UserRole;
   startTime: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ClientInfo extends IClientInfo { }
class ClientInfo {
   constructor(info: IClientInfo) {
      this.browser = info.browser;
      this.id = info.id;
      this.language = info.language;
      this.sessionId = info.sessionId;
      this.startTime = info.startTime;
      this.userName = info.userName;
      this.userRole = info.userRole;
      this.version = info.version;
   }

   static fromConnectInfo(
      info: ConnectInfo,
      id: number,
      userRole: UserRole,
      startTime: Date
   ) {
      return new ClientInfo({
         id, userRole, startTime,
         userName: info.userName || '',
         language: info.language || Language.German,
         browser: info.browser || '',
         ...info
      });
   }
}
export { ClientInfo };

const empty: IClientInfo = {
   browser: '',
   id: 0,
   language: Language.German,
   sessionId: '',
   startTime: new Date(),
   userName: '',
   userRole: UserRole.Guest,
   version: ''
};
export const fClientInfo = createJsonFactory<ClientInfo, IClientInfo>(
   () => new ClientInfo(empty), {
   browser: true,
   id: true,
   language: true,
   sessionId: true,
   startTime: jsonDateSerializer,
   userName: true,
   userRole: true,
   version: true
});

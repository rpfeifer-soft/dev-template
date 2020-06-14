/** @format */

import createJsonFactory, { jsonDateSerializer } from '../Msg/JsonFactory.js';
import { UserRole } from '../Msg/Types.js';

interface IClientInfo {
   id: number;
   sessionId: string;
   userName: string;
   userRole: UserRole;
   startTime: Date;
   version: string;
}

interface ClientInfo extends IClientInfo { };
class ClientInfo {
   constructor(info?: IClientInfo) {
      if (info) {
         this.id = info.id;
         this.sessionId = info.sessionId;
         this.userName = info.userName;
         this.userRole = info.userRole;
         this.startTime = info.startTime;
         this.version = info.version;
      };
   }
};
export default ClientInfo;

export const fClientInfo = createJsonFactory<ClientInfo, IClientInfo>(ClientInfo, {
   id: true,
   sessionId: true,
   userName: true,
   userRole: true,
   startTime: jsonDateSerializer,
   version: true
});

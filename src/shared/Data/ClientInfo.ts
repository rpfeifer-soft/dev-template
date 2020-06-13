/** @format */

import createJsonFactory, { jsonDateSerializer } from '../Msg/JsonFactory.js';

enum UserRole {
   Guest = 1,
   User = 2,
   Admin = 4
}

interface IClientInfo {
   id: string;
   userName: string;
   userRole: UserRole;
   startTime: Date;
   version: string;
}

interface ClientInfo extends IClientInfo { };
class ClientInfo {
};
export default ClientInfo;

export const fClientInfo = createJsonFactory<ClientInfo, IClientInfo>(ClientInfo, {
   id: true,
   userName: true,
   userRole: true,
   startTime: jsonDateSerializer,
   version: true
});

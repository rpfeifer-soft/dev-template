/** @format */

import createJsonFactory, { jsonDateSerializer } from '../Msg/JsonFactory.js';
import { UserRole } from '../Msg/Types.js';

interface IClientInfo {
   id: number;
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

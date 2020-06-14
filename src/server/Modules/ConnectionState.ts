/** @format */

import Clients from '../Clients.js';
import { ServerFunction, ClientFunction } from '../../shared/Functions.js';
import { UserRole } from '../../shared/Msg/Types.js';
import ConnectInfo from '../../shared/Data/ConnectInfo.js';
import ClientInfo from '../../shared/Data/ClientInfo.js';
import options from '../Options.js';

function checkConnection(info: ConnectInfo): ClientInfo | string {
   if (info.version !== options.getVersion()) {
      return `Version mismatch: ${info.version} <> ${options.getVersion()}`;
   }

   let clientInfo = new ClientInfo();
   clientInfo.sessionId = info.sessionId;
   clientInfo.version = info.version;
   clientInfo.startTime = new Date();
   clientInfo.userName = '';
   clientInfo.userRole = UserRole.Guest;
   return clientInfo;
}

export default function connectionState() {

   Clients.on(ServerFunction.Connect, async (info, client) => {
      let clientInfo = checkConnection(info);
      // Analyze the connection info
      if (typeof clientInfo === 'string') {
         // Close the connection after a short timeout to allow error to be delivered!
         setTimeout(() => client.close(), 1000);
         throw new Error(clientInfo);
      }

      // Copy the needed values
      client.sessionId = clientInfo.sessionId;
      client.startTime = clientInfo.startTime;
      client.userName = clientInfo.userName;
      client.userRole = clientInfo.userRole;
      client.version = clientInfo.version;

      // Add to the list of clients (generates a unique id for the client)
      Clients.add(client);

      // Return the actual client info
      return client.getClientInfo();
   });

   Clients.onChangedClient((client) => {
      // The clients have changed (notify the other clients)
      let clientInfo = client.getClientInfo();
      Clients.forEach((dest) => {
         if (dest.id !== client.id) {
            dest.call(ClientFunction.ClientChanged, clientInfo);
         }
      });
   });

   Clients.onRemovedClients((ids: number[]) => {
      Clients.forEach((dest) => {
         dest.call(ClientFunction.ClientsRemoved, ids);
      });
   });

   Clients.on(ServerFunction.GetClientInfos, async () => {
      return Clients.map(client => client.getClientInfo());
   });
};
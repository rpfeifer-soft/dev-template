/** @format */

import { clients } from '../clients.js';
import { ServerFunction, ClientFunction } from '../../shared/communication-api.js';
import { UserRole } from '../../shared/types.js';
import { ConnectInfo } from '../../shared/data/ConnectInfo.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { options } from '../options.js';

function checkConnection(info: ConnectInfo): ClientInfo | string {
   if (info.version !== options.getVersion()) {
      return `Version mismatch: ${info.version} <> ${options.getVersion()}`;
   }
   return ClientInfo.fromConnectInfo(info, 0, UserRole.Guest, new Date());
}

export function connectionState(): void {

   clients.on(ServerFunction.Connect, async (info, client) => {
      const clientInfo = checkConnection(info);
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
      clients.add(client);

      // Return the actual client info
      return client.getClientInfo();
   });

   clients.onChangedClient((client) => {
      // The clients have changed (notify the other clients)
      const clientInfo = client.getClientInfo();
      clients.forEach((dest) => {
         if (dest.id !== client.id) {
            dest.call(ClientFunction.ClientChanged, clientInfo);
         }
      });
   });

   clients.onRemovedClients((ids: number[]) => {
      clients.forEach((dest) => {
         dest.call(ClientFunction.ClientsRemoved, ids);
      });
   });

   clients.on(ServerFunction.GetClientInfos, async () => {
      return clients.map(client => client.getClientInfo());
   });
}
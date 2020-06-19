/** @format */

import { Constructor } from '../../shared/types.js';
import { clients } from '../clients.js';
import { ServerFunction, ClientFunction } from '../../shared/api.js';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addConnections<T extends Constructor>(Base: T) {
   return class extends Base {

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
         super(...args);

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
   };
}

/** @format */

import { Constructor } from '../../shared/types.js';
import { ClientInfo } from '../../shared/data/data.js';
import { server } from '../server.js';
import { ClientFunction, ServerFunction } from '../../shared/api.js';

export interface IClientMap {
   [id: number]: ClientInfo;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addConnections<T extends Constructor>(Base: T) {
   return class extends Base {

      // Init with the default values
      allClients: IClientMap = {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
         super(...args);

         // Register handlers
         server.on(ClientFunction.ClientChanged, async (client: ClientInfo) => {
            const me = server.me;
            if (me && me.id === client.id) {
               server.setMe(client);
            } else {
               this.allClients[client.id] = client;
            }
         });

         server.on(ClientFunction.ClientsRemoved, async (ids: number[]) => {
            ids.forEach(id => delete this.allClients[id]);
         });

         // Get the starting infos
         this.allClients = {};
      }

      updateMe(clientInfo?: ClientInfo): void {
         super.updateMe(clientInfo);
         if (clientInfo) {
            this.allClients[clientInfo.id] = clientInfo;
         }
      }

      onInit(info: ClientInfo): void {
         super.onInit(info);

         server.call(ServerFunction.GetClientInfos)
            .then(clientInfos => {
               clientInfos.forEach(clientInfo =>
                  this.allClients[clientInfo.id] = clientInfo);
            });
      }
   };
}


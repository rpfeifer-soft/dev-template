/** @format */

import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { server } from '../server.js';
import { ClientFunction, ServerFunction } from '../../shared/Functions.js';
import registerDebug from './Debug.js';

interface IClientMap {
   [id: number]: ClientInfo;
}

export default async function connectionState(info: ClientInfo) {
   // Init with the default values
   let all: IClientMap = {};

   // Allow debugging
   registerDebug('me', () => server.me);
   registerDebug('all', () => all);

   // handle change to current instance
   server.onChangeMe(() => {
      if (server.me) {
         all[server.me.id] = server.me;
      }
   });
   server.setMe(info);

   // Register handlers
   server.on(ClientFunction.ClientChanged, async (client: ClientInfo) => {
      let me = server.me;
      if (me && me.id === client.id) {
         server.setMe(client);
      } else {
         all[client.id] = client;
      }
   });

   server.on(ClientFunction.ClientsRemoved, async (ids: number[]) => {
      ids.forEach(id => delete all[id]);
   });

   // Get the starting infos
   all = {};
   let clientInfos = await server.call(ServerFunction.GetClientInfos);
   clientInfos.forEach(clientInfo => all[clientInfo.id] = clientInfo);
};

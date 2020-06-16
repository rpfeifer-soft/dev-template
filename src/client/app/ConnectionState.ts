/** @format */

import ClientInfo from '../../shared/data/ClientInfo.js';
import Server from '../Server.js';
import { ClientFunction, ServerFunction } from '../../shared/Functions.js';
import registerDebug from './Debug.js';

interface IClientMap {
   [id: number]: ClientInfo;
}

export default async function connectionState(info: ClientInfo) {
   // Init with the default values
   let all: IClientMap = {};

   // Allow debugging
   registerDebug('me', () => Server.me);
   registerDebug('all', () => all);

   // handle change to current instance
   Server.onChangeMe(() => {
      if (Server.me) {
         all[Server.me.id] = Server.me;
      }
   });
   Server.setMe(info);

   // Register handlers
   Server.on(ClientFunction.ClientChanged, async (client: ClientInfo) => {
      let me = Server.me;
      if (me && me.id === client.id) {
         Server.setMe(client);
      } else {
         all[client.id] = client;
      }
   });

   Server.on(ClientFunction.ClientsRemoved, async (ids: number[]) => {
      ids.forEach(id => delete all[id]);
   });

   // Get the starting infos
   all = {};
   let clientInfos = await Server.call(ServerFunction.GetClientInfos);
   clientInfos.forEach(clientInfo => all[clientInfo.id] = clientInfo);
};

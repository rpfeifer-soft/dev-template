/** @format */

import ClientInfo from '../../shared/Data/ClientInfo.js';
import Server from '../Server.js';
import { ClientFunction, ServerFunction } from '../../shared/Functions.js';

interface IClientMap {
   [id: number]: ClientInfo;
}

class App {
   self?: ClientInfo;
   all: IClientMap = {};

   setClients(infos: ClientInfo[]) {
      this.all = {};
      infos.forEach(info => this.all[info.id] = info);
   }

   clientChanged(info: ClientInfo) {
      if (this.self && this.self.id === info.id) {
         this.self = info;
      }
      this.all[info.id] = info;
   }

   clientsRemoved(ids: number[]) {
      ids.forEach(id => delete this.all[id]);
   }

   async setUser(userName: string) {
      Server.call(ServerFunction.SetUser, userName)
         .then(p => {
            this.clientChanged(p);
            console.log(p);
         })
         .catch(error => console.error(error));
   }

   async sendAuthCode() {
      Server.call(ServerFunction.SendAuthCode)
         .then(p => console.log(p))
         .catch(error => console.error(error));
   }

   async login(authCode: string) {
      Server.call(ServerFunction.Login, authCode)
         .then(p => {
            this.clientChanged(p);
            console.log(p);
         })
         .catch(error => console.error(error));
   }

   async logoff() {
      Server.call(ServerFunction.Logoff)
         .then(p => {
            this.clientChanged(p);
            console.log(p);
         })
         .catch(error => console.error(error));
   }

   // eslint-disable-next-line no-console
   dump = () => console.log(this);
}
let app = new App();
// eslint-disable-next-line @typescript-eslint/dot-notation
if (window['isProduction']) {
   // eslint-disable-next-line @typescript-eslint/dot-notation
   window['app'] = app;
}

export default async function initApp(info: ClientInfo) {
   // Init with the default values
   app.self = info;
   app.all = [info];

   // Register handlers
   Server.on(ClientFunction.ClientChanged, async (client: ClientInfo) => {
      app.clientChanged(client);
   });

   Server.on(ClientFunction.ClientsRemoved, async (ids: number[]) => {
      app.clientsRemoved(ids);
   });

   // Get the starting infos
   app.setClients(await Server.call(ServerFunction.GetClientInfos));
   app.dump();
};
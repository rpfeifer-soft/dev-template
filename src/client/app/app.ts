/** @format */

import { server } from '../server.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { addLogin } from './addLogin.js';
import { Language } from '../../shared/types.js';
import { ServerFunction, ClientFunction } from '../../shared/api.js';

export interface IClientMap {
   [id: number]: ClientInfo;
}

class BaseApp {
   browser: string;
   id: number;
   version: string;
   startTime: Date;
   language: Language;
   allClients: IClientMap = {};

   constructor() {
      // Use default values for initialization
      this.browser = '';
      this.id = 0;
      this.version = '';
      this.startTime = new Date();
      this.language = Number(localStorage.getItem('language') || Language.German);
      this.allClients = {};

      // Initialize first
      this.updateMe(server.me);

      // Update on change
      server.onChangeMe(() => this.updateMe(server.me));
   }

   updateMe(clientInfo?: ClientInfo): void {
      if (clientInfo) {
         this.browser = clientInfo.browser;
         this.id = clientInfo.id;
         this.version = clientInfo.version;
         this.startTime = clientInfo.startTime;
         this.language = clientInfo.language;
         this.allClients[clientInfo.id] = clientInfo;
         // Save to storage
         localStorage.setItem('language', String(this.language));
      }
   }

   async setLanguage(language: Language): Promise<void> {
      server.call(ServerFunction.SetLanguage, language)
         .then(p => server.setMe(p))
         // eslint-disable-next-line no-console
         .catch(error => console.error(error));
   }

   onInit(clientInfo: ClientInfo): void {
      server.setMe(clientInfo);

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

      server.call(ServerFunction.GetClientInfos)
         .then(clientInfos => {
            clientInfos.forEach(info =>
               this.allClients[info.id] = clientInfo);
         });
   }
}

const App =
   addLogin(
      BaseApp
   );

export const app = new App();

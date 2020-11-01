/** @format */

import { server } from '../server.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { Language, UserRole } from '../../shared/types.js';
import { ServerFunction, ClientFunction } from '../../shared/api.js';

export interface IClientMap {
   [id: number]: ClientInfo;
}

function uuidv4() {
   return (String([1e7]) + String(-1e3) + String(-4e3) + String(-8e3) + String(-1e11))
      .replace(/[018]/g, c =>
         // eslint-disable-next-line no-bitwise
         (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
      );
}

function getSessionId() {
   let sessionId = localStorage.getItem('sessionId');
   if (!sessionId) {
      // Create a new session id
      sessionId = uuidv4();
      localStorage.setItem('sessionId', sessionId);
   }
   return sessionId;
}

class App {
   browser: string;
   id: number;
   version: string;
   startTime: Date;
   language: Language;
   allClients: IClientMap = {};
   sessionId: string;
   userName: string;
   userRole: UserRole;

   constructor() {
      // Use default values for initialization
      this.browser = '';
      this.id = 0;
      this.version = '';
      this.startTime = new Date();
      this.language = Number(localStorage.getItem('language') || Language.German);
      this.allClients = {};
      this.sessionId = getSessionId();
      this.userName = localStorage.getItem('userName') || '';
      this.userRole = UserRole.Guest;

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
         this.userName = clientInfo.userName;
         this.userRole = clientInfo.userRole;
         // Save to storage
         localStorage.setItem('language', String(this.language));
         localStorage.setItem('userName', this.userName);
      }
   }

   async setLanguage(language: Language): Promise<void> {
      server.call(ServerFunction.SetLanguage, language)
         .then(p => server.setMe(p))
         // eslint-disable-next-line no-console
         .catch(error => console.error(error));
   }

   async setUser(userName: string): Promise<void> {
      server.call(ServerFunction.SetUser, userName)
         .then(p => server.setMe(p))
         // eslint-disable-next-line no-console
         .catch(error => console.error(error));
   }

   async sendAuthCode(): Promise<void> {
      server.call(ServerFunction.SendAuthCode)
         // eslint-disable-next-line no-console
         .then(p => console.log(p))
         // eslint-disable-next-line no-console
         .catch(error => console.error(error));
   }

   async login(authCode: string): Promise<void> {
      server.call(ServerFunction.Login, authCode)
         .then(p => server.setMe(p))
         // eslint-disable-next-line no-console
         .catch(error => console.error(error));
   }

   async logoff(): Promise<void> {
      server.call(ServerFunction.Logoff)
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
            this.allClients = {};
            clientInfos.forEach(info =>
               this.allClients[info.id] = clientInfo);
         });
   }
}
export const app = new App();

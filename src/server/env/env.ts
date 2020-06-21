/* eslint-disable @typescript-eslint/no-unused-vars */
/** @format */

import { options } from '../options.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { ConnectInfo } from '../../shared/data/ConnectInfo.js';
import { clients } from '../clients.js';
import { ServerFunction, ClientFunction } from '../../shared/api.js';
import { addLogin, IUserLogin } from './addLogin.js';
import { userRoles, UserRole, Language } from '../../shared/types.js';

function checkConnection(info: ConnectInfo): ClientInfo | string {
   if (info.version !== options.getVersion()) {
      return `Version mismatch: ${info.version} <> ${options.getVersion()}`;
   }
   return ClientInfo.connect(info);
}

class EnvBase {
   version: string;
   startTime: Date;

   constructor() {
      this.version = options.getVersion() || '';
      this.startTime = new Date();
   }

   onInit() {
      this.startTime = new Date();

      clients.on(ServerFunction.Connect, async (info, client) => {
         const clientInfo = checkConnection(info);
         // Analyze the connection info
         if (typeof clientInfo === 'string') {
            // Close the connection after a short timeout to allow error to be delivered!
            setTimeout(() => client.close(), 1000);
            throw new Error(clientInfo);
         }

         // Copy the needed values (after saving own values)
         clientInfo.id = client.id;
         clientInfo.startTime = client.startTime;

         client.setClientInfo(clientInfo);
         // Add to the list of clients (generates a unique id for the client)
         clients.add(client);

         // Return the actual client info
         return client.getClientInfo();
      });

      // LANGUAGE
      clients.on(ServerFunction.SetLanguage, async (language, client) => {
         if (client.language !== language) {
            if (typeof (Language[language]) !== 'string' ||
               Language[Language[language]] !== language) {
               throw new Error('Unsupported language');
            }
            client.language = language;
            // Notify the other clients
            clients.changedClient(client);
         }
         // Update was successful
         return client.getClientInfo();
      });

      // CONNECTIONS
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
}

const userLogin: IUserLogin = {
   async getAuthCode(userName: string) {
      return userName.split('').reverse().join('');
   },

   async getUserRole(userName: string) {
      return userName === 'René' ? userRoles(UserRole.Admin, UserRole.User) : UserRole.User;
   }
};

const Env =
   addLogin(
      EnvBase
      , userLogin
   );

export const env = new Env();
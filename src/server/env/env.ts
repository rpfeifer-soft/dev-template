/* eslint-disable @typescript-eslint/no-unused-vars */
/** @format */

import { options } from '../options.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { ConnectInfo } from '../../shared/data/ConnectInfo.js';
import { clients } from '../clients.js';
import { ServerFunction, ClientFunction } from '../../shared/api.js';
import { UserRole, Language } from '../../shared/types.js';

export interface IUserLogin {
   getAuthCode(userName: string): Promise<string>;
   getUserRole(userName: string): Promise<UserRole>;
}

function checkConnection(info: ConnectInfo): ClientInfo | string {
   if (info.version !== options.getVersion()) {
      return `Version mismatch: ${info.version} <> ${options.getVersion()}`;
   }
   return ClientInfo.connect(info);
}

class Env {
   version: string;
   startTime: Date;

   constructor() {
      this.version = options.getVersion() || '';
      this.startTime = new Date();
   }

   onInit(userLogin: IUserLogin): void {
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

      // LOGIN
      clients.on(ServerFunction.SetUser, async (userName, client) => {
         if (client.userRole !== UserRole.Guest) {
            throw new Error('UserName must not be changed after login!');
         }
         client.userName = userName;
         // Notify the other clients
         clients.changedClient(client);
         // Update was successful
         return client.getClientInfo();
      });

      clients.on(ServerFunction.SendAuthCode, async (_, client) => {
         if (client.userRole !== UserRole.Guest) {
            throw new Error('Already logged in!');
         }
         if (!client.userName) {
            throw new Error('UserName not given!');
         }
         // eslint-disable-next-line no-console
         console.log('AuthCode', await userLogin.getAuthCode(client.userName));
         return true;
      });

      clients.on(ServerFunction.Login, async (authCode, client) => {
         if (client.userRole !== UserRole.Guest) {
            throw new Error('Already logged in!');
         }
         if (!client.userName) {
            throw new Error('UserName not given!');
         }
         if (authCode !== await userLogin.getAuthCode(client.userName)) {
            throw new Error('Login failed!');
         }
         // Set the user-role
         client.userRole = await userLogin.getUserRole(client.userName);
         // Notify the other clients
         clients.changedClient(client);
         // Update this client
         return client.getClientInfo();
      });

      clients.on(ServerFunction.Logoff, async (_, client) => {
         if (client.userRole === UserRole.Guest) {
            throw new Error('Not logged in!');
         }
         // Set the user-role
         client.userRole = UserRole.Guest;
         // Notify the other clients
         clients.changedClient(client);
         // Update this client
         return client.getClientInfo();
      });
   }
}
export const env = new Env();
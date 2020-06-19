/** @format */

import { options } from '../options.js';
import { addLogin, IUserLogin } from './addLogin.js';
import { userRoles, UserRole } from '../../shared/types.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { ConnectInfo } from '../../shared/data/ConnectInfo.js';
import { clients } from '../clients.js';
import { ServerFunction } from '../../shared/api.js';
import { addConnections } from './addConnections.js';

function checkConnection(info: ConnectInfo): ClientInfo | string {
   if (info.version !== options.getVersion()) {
      return `Version mismatch: ${info.version} <> ${options.getVersion()}`;
   }
   return ClientInfo.fromConnectInfo(info, 0, UserRole.Guest, new Date());
}

class EnvBase {
   version: string;
   startTime: Date;

   constructor() {
      this.version = options.getVersion() || '';
      this.startTime = new Date();

      clients.on(ServerFunction.Connect, async (info, client) => {
         const clientInfo = checkConnection(info);
         // Analyze the connection info
         if (typeof clientInfo === 'string') {
            // Close the connection after a short timeout to allow error to be delivered!
            setTimeout(() => client.close(), 1000);
            throw new Error(clientInfo);
         }

         // Copy the needed values
         client.browser = clientInfo.browser;
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
   }

   onInit() {
      this.startTime = new Date();
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
   addConnections(
      addLogin(EnvBase, userLogin)
   );

export const env = new Env();
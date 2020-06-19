/** @format */

import { Constructor, UserRole } from '../../shared/types.js';
import { clients } from '../clients.js';
import { ServerFunction } from '../../shared/api.js';

export interface IUserLogin {
   getAuthCode(userName: string): Promise<string>;
   getUserRole(userName: string): Promise<UserRole>;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addLogin<T extends Constructor>(Base: T, userLogin: IUserLogin) {
   return class extends Base {

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
         super(...args);

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
   };
}

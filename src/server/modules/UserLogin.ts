/** @format */

import Clients from '../Clients.js';
import { ServerFunction } from '../../shared/Functions.js';
import { UserRole } from '../../shared/msg/Types.js';

function getAuthCode(userName: string) {
   return userName.split('').reverse().join('');
}

function getUserRole(userName: string) {
   // eslint-disable-next-line no-bitwise
   return userName === 'René' ? UserRole.Admin | UserRole.User : UserRole.User;
}

export default function userLogin() {

   Clients.on(ServerFunction.SetUser, async (userName, client) => {
      if (client.userRole !== UserRole.Guest) {
         throw new Error('UserName must not be changed after login!');
      }
      client.userName = userName;
      // Notify the other clients
      Clients.changedClient(client);
      // Update was successful
      return client.getClientInfo();
   });

   Clients.on(ServerFunction.SendAuthCode, async (_, client) => {
      if (client.userRole !== UserRole.Guest) {
         throw new Error('Already logged in!');
      }
      if (!client.userName) {
         throw new Error('UserName not given!');
      }
      // eslint-disable-next-line no-console
      console.log('AuthCode', getAuthCode(client.userName));
      return true;
   });

   Clients.on(ServerFunction.Login, async (authCode, client) => {
      if (client.userRole !== UserRole.Guest) {
         throw new Error('Already logged in!');
      }
      if (!client.userName) {
         throw new Error('UserName not given!');
      }
      if (authCode !== getAuthCode(client.userName)) {
         throw new Error('Login failed!');
      }
      // Set the user-role
      client.userRole = getUserRole(client.userName);
      // Notify the other clients
      Clients.changedClient(client);
      // Update this client
      return client.getClientInfo();
   });

   Clients.on(ServerFunction.Logoff, async (_, client) => {
      if (client.userRole === UserRole.Guest) {
         throw new Error('Not logged in!');
      }
      // Set the user-role
      client.userRole = UserRole.Guest;
      // Notify the other clients
      Clients.changedClient(client);
      // Update this client
      return client.getClientInfo();
   });
}
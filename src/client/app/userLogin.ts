/** @format */

import { server } from '../server.js';
import { ServerFunction } from '../../shared/api.js';
import { registerDebug } from './registerDebug.js';

class UserLogin {
   async setUser(userName: string) {
      server.call(ServerFunction.SetUser, userName)
         .then(p => server.setMe(p))
         .catch(error => console.error(error));
   }

   async sendAuthCode() {
      server.call(ServerFunction.SendAuthCode)
         .then(p => console.log(p))
         .catch(error => console.error(error));
   }

   async login(authCode: string) {
      server.call(ServerFunction.Login, authCode)
         .then(p => server.setMe(p))
         .catch(error => console.error(error));
   }

   async logoff() {
      server.call(ServerFunction.Logoff)
         .then(p => server.setMe(p))
         .catch(error => console.error(error));
   }
}
const data = new UserLogin();

export async function userLogin(): Promise<void> {
   registerDebug('login', () => data);
};
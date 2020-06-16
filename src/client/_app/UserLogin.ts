/** @format */

import Server from '../Server.js';
import { ServerFunction } from '../../shared/Functions.js';
import registerDebug from './Debug.js';

class UserLogin {
   async setUser(userName: string) {
      Server.call(ServerFunction.SetUser, userName)
         .then(p => Server.setMe(p))
         .catch(error => console.error(error));
   }

   async sendAuthCode() {
      Server.call(ServerFunction.SendAuthCode)
         .then(p => console.log(p))
         .catch(error => console.error(error));
   }

   async login(authCode: string) {
      Server.call(ServerFunction.Login, authCode)
         .then(p => Server.setMe(p))
         .catch(error => console.error(error));
   }

   async logoff() {
      Server.call(ServerFunction.Logoff)
         .then(p => Server.setMe(p))
         .catch(error => console.error(error));
   }
}
let data = new UserLogin();

export default async function userLogin() {
   registerDebug('login', () => data);
};
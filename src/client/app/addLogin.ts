/* eslint-disable no-console */
/** @format */

import { Constructor, UserRole } from '../../shared/types.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { server } from '../server.js';
import { ServerFunction } from '../../shared/api.js';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addLogin<T extends Constructor>(Base: T) {
   return class extends Base {

      sessionId: string;
      userName: string;
      userRole: UserRole;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
         super(...args);
         this.userName = '';
         this.userRole = UserRole.Guest;
      }

      updateMe(clientInfo?: ClientInfo): void {
         super.updateMe(clientInfo);
         if (clientInfo) {
            this.sessionId = clientInfo.sessionId;
            this.userName = clientInfo.userName;
            this.userRole = clientInfo.userRole;
         }
      }

      async setUser(userName: string): Promise<void> {
         server.call(ServerFunction.SetUser, userName)
            .then(p => server.setMe(p))
            .catch(error => console.error(error));
      }

      async sendAuthCode(): Promise<void> {
         server.call(ServerFunction.SendAuthCode)
            .then(p => console.log(p))
            .catch(error => console.error(error));
      }

      async login(authCode: string): Promise<void> {
         server.call(ServerFunction.Login, authCode)
            .then(p => server.setMe(p))
            .catch(error => console.error(error));
      }

      async logoff(): Promise<void> {
         server.call(ServerFunction.Logoff)
            .then(p => server.setMe(p))
            .catch(error => console.error(error));
      }
   };
}


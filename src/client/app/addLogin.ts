/* eslint-disable no-console */
/** @format */

import { Constructor, UserRole } from '../../shared/types.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { server } from '../server.js';
import { ServerFunction } from '../../shared/api.js';

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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addLogin<T extends Constructor>(Base: T) {
   return class extends Base {

      sessionId: string;
      userName: string;
      userRole: UserRole;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
         super(...args);
         // Read from storage
         this.sessionId = getSessionId();
         this.userName = localStorage.getItem('userName') || '';
         this.userRole = UserRole.Guest;
      }

      updateMe(clientInfo?: ClientInfo): void {
         super.updateMe(clientInfo);
         if (clientInfo) {
            this.userName = clientInfo.userName;
            this.userRole = clientInfo.userRole;
            // Save to storage
            localStorage.setItem('userName', this.userName);
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


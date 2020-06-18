/** @format */

import { server } from '../server.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { addLogin } from './addLogin.js';
import { addConnections } from './addConnections.js';

class BaseApp {
   browser: string;
   id: number;
   version: string;
   startTime: Date;

   constructor() {
      // Use default values for initialization
      this.browser = '';
      this.id = 0;
      this.version = '';
      this.startTime = new Date();

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
      }
   }

   onInit(clientInfo: ClientInfo): void {
      server.setMe(clientInfo);
   }
}

const App =
   addConnections(
      addLogin(BaseApp)
   );

export const app = new App();

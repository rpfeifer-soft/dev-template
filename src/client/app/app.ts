/** @format */

import { server } from '../server.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { addConnections } from './addConnections.js';
import { addLogin } from './addLogin.js';
import { Language } from '../../shared/types.js';
import { ServerFunction } from '../../shared/api.js';

class BaseApp {
   browser: string;
   id: number;
   version: string;
   startTime: Date;
   language: Language;

   constructor() {
      // Use default values for initialization
      this.browser = '';
      this.id = 0;
      this.version = '';
      this.startTime = new Date();

      // Read from storage
      this.language = Number(localStorage.getItem('language') || Language.German);

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
         this.language = clientInfo.language;
         // Save to storage
         localStorage.setItem('language', String(this.language));
      }
   }

   async setLanguage(language: Language): Promise<void> {
      server.call(ServerFunction.SetLanguage, language)
         .then(p => server.setMe(p))
         // eslint-disable-next-line no-console
         .catch(error => console.error(error));
   }

   onInit(clientInfo: ClientInfo): void {
      server.setMe(clientInfo);
   }
}

const App =
   addLogin(
      addConnections(
         BaseApp
      )
   );

export const app = new App();

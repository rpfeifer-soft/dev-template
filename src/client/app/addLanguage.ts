/* eslint-disable no-console */
/** @format */

import { Constructor, Language } from '../../shared/types.js';
import { ClientInfo } from '../../shared/data/ClientInfo.js';
import { server } from '../server.js';
import { ServerFunction } from '../../shared/api.js';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addLanguage<T extends Constructor>(Base: T) {
   return class extends Base {

      language: Language;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
         super(...args);
         // Read from storage
         this.language = Number(localStorage.getItem('language') || Language.German);
      }

      updateMe(clientInfo?: ClientInfo): void {
         super.updateMe(clientInfo);
         if (clientInfo) {
            this.language = clientInfo.language || Language.German;
            // Save to storage
            localStorage.setItem('language', String(this.language));
         }
      }

      async setLanguage(language: Language): Promise<void> {
         server.call(ServerFunction.SetLanguage, language)
            .then(p => server.setMe(p))
            .catch(error => console.error(error));
      }
   };
}


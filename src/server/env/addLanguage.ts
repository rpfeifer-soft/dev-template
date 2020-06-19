/** @format */

import { Constructor, Language } from '../../shared/types.js';
import { clients } from '../clients.js';
import { ServerFunction } from '../../shared/api.js';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addLanguage<T extends Constructor>(Base: T) {
   return class extends Base {

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
         super(...args);

         clients.on(ServerFunction.SetLanguage, async (language, client) => {
            if (client.language !== language) {
               if (typeof (Language[language]) !== 'string' ||
                  Language[Language[language]] !== language) {
                  throw new Error('Unsupported language');
               }
               client.language = language;
               // Notify the other clients
               clients.changedClient(client);
            }
            // Update was successful
            return client.getClientInfo();
         });
      }
   };
}

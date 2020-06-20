/** @format */

import { Constructor, Language } from '../../shared/types.js';
import { ByteArray } from '../serialize/ByteArray.js';
import { createBinaryFactory } from '../serialize/factories.js';
import { IMessagesFactory } from '../serialize/Message.js';
import { ConnectInfo, ClientInfo } from './data.js';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addLanguage<T extends Constructor>(Base: T) {
   return class AddLanguage extends Base {

      language: Language;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
         super(...args);
      }

      connect(info: ConnectInfo): void {
         super.connect(info);

         this.language = info.language;
      }

      set(info: ClientInfo): void {
         super.set(info);

         this.language = info.language;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      readFrom(bytes: ByteArray, opt: (key: string) => void): void {
         super.readFrom(bytes, opt);

         this.language = bytes.getNumber() || Language.German;
      }

      writeTo(bytes: ByteArray): void {
         super.writeTo(bytes);

         bytes.addNumber(this.language);
      }

      getFactory(): IMessagesFactory<AddLanguage> {
         return createBinaryFactory<AddLanguage>(() => new AddLanguage(),
            (bytes: ByteArray, data: AddLanguage, opt: (key: string) => void) => {
               data.readFrom(bytes, opt);
            },
            (data: AddLanguage, bytes: ByteArray) => {
               data.writeTo(bytes);
            });
      }
   };
}

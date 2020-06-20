/** @format */

import { Constructor, UserRole } from '../types.js';
import { ByteArray } from '../serialize/ByteArray.js';
import { createBinaryFactory } from '../serialize/factories.js';
import { IMessagesFactory } from '../serialize/Message.js';
import { ConnectInfo, ClientInfo } from './data.js';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addLoginWithoutUserRole<T extends Constructor>(Base: T) {
   return class AddLogin extends Base {

      sessionId: string;
      userName: string;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
         super(...args);
      }

      connect(info: ConnectInfo): void {
         super.connect(info);

         this.sessionId = info.sessionId;
         this.userName = info.userName;
      }

      set(info: ClientInfo): void {
         super.set(info);

         this.sessionId = info.sessionId;
         this.userName = info.userName;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      readFrom(bytes: ByteArray, opt: (key: string) => void): void {
         super.readFrom(bytes, opt);

         this.sessionId = bytes.getString() || '';
         this.userName = bytes.getString() || '';
      }

      writeTo(bytes: ByteArray): void {
         super.writeTo(bytes);

         bytes.addString(this.sessionId);
         bytes.addString(this.userName);
      }

      getFactory(): IMessagesFactory<AddLogin> {
         return createBinaryFactory<AddLogin>(() => new AddLogin(),
            (bytes: ByteArray, data: AddLogin, opt: (key: string) => void) => {
               data.readFrom(bytes, opt);
            },
            (data: AddLogin, bytes: ByteArray) => {
               data.writeTo(bytes);
            });
      }
   };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addLogin<T extends Constructor>(Base: T) {
   return addLoginWithoutUserRole(class AddLogin extends Base {

      userRole: UserRole;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
         super(...args);
      }

      connect(info: ConnectInfo): void {
         super.connect(info);

         this.userRole = UserRole.Guest;
      }

      set(info: ClientInfo): void {
         super.set(info);

         this.userRole = info.userRole;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      readFrom(bytes: ByteArray, opt: (key: string) => void): void {
         super.readFrom(bytes, opt);

         this.userRole = bytes.getNumber() || UserRole.Guest;
      }

      writeTo(bytes: ByteArray): void {
         super.writeTo(bytes);

         bytes.addNumber(this.userRole);
      }

      getFactory(): IMessagesFactory<AddLogin> {
         return createBinaryFactory<AddLogin>(() => new AddLogin(),
            (bytes: ByteArray, data: AddLogin, opt: (key: string) => void) => {
               data.readFrom(bytes, opt);
            },
            (data: AddLogin, bytes: ByteArray) => {
               data.writeTo(bytes);
            });
      }
   });
}

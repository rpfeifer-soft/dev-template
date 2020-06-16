/** @format */

import { ByteArray } from '../ByteArray.js';

export abstract class Message {

   abstract parse(data: string | ArrayBuffer | ByteArray): this;

   abstract stringify(): string | ArrayBuffer;
}

export interface IMessageFactory<T> {
   pack: (data?: T) => Message;
   unpack: (msg: Message) => T | undefined;
}

export interface IMessagesFactory<T> extends IMessageFactory<T> {
   array: IMessageFactory<T[]>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toJSON(value: any): string {
   if (value === undefined) {
      return 'undefined';
   }
   return JSON.stringify(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromJSON(text: string): any {
   if (text === 'undefined') {
      return undefined;
   }
   return JSON.parse(text);
}

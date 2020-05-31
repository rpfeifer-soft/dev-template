/** @format */

import ByteArray from './ByteArray.js';

abstract class Message {

   abstract parse(data: string | ArrayBuffer): this;

   abstract stringify(): string | ArrayBuffer;
}

// eslint-disable-next-line no-redeclare
namespace Message {
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

   export function parseMessage<T extends Message>(ctor: (new () => T), data: string | ArrayBuffer) {
      let msg = new ctor();
      return msg.parse(data);
   }

   // Special data implementation
   class Data<U> extends Message {

      constructor(public data?: U) {
         super();
      }

      parse(data: string | ArrayBuffer) {
         if (typeof (data) !== 'string') {
            throw new Error('ArrayBuffer not support for generic data!');
         }
         this.data = Message.fromJSON(data) as U;
         return this;
      }

      stringify(): string | ArrayBuffer {
         return Message.toJSON(this.data);
      }
   }

   // eslint-disable-next-line id-blacklist
   export class String extends Data<string> {
      static parse(data: string | ArrayBuffer) {
         return Message.parseMessage(String, data);
      }

      parse(data: ArrayBuffer) {
         let bytes = new ByteArray(data);
         this.data = bytes.getString();
         return this;
      }

      stringify() {
         let bytes = new ByteArray();
         bytes.addString(this.data);
         return bytes.getArrayBuffer();
      }
   }
   // eslint-disable-next-line id-blacklist
   export class Boolean extends Data<boolean> {
      static parse(data: string | ArrayBuffer) {
         return Message.parseMessage(Boolean, data);
      }

      parse(data: ArrayBuffer) {
         let bytes = new ByteArray(data);
         this.data = bytes.getBoolean();
         return this;
      }

      stringify() {
         let bytes = new ByteArray();
         bytes.addBoolean(this.data);
         return bytes.getArrayBuffer();
      }
   }
   // eslint-disable-next-line id-blacklist
   export class Number extends Data<number> {
      static parse(data: string | ArrayBuffer) {
         return Message.parseMessage(Number, data);
      }

      parse(data: ArrayBuffer) {
         let bytes = new ByteArray(data);
         this.data = bytes.getNumber();
         return this;
      }

      stringify() {
         let bytes = new ByteArray();
         bytes.addNumber(this.data);
         return bytes.getArrayBuffer();
      }
   }
   export class Time extends Data<Date> {
      constructor(data?: Date) {
         super(data ? new Date(data.getTime()) : undefined);
      }

      static parse(data: string | ArrayBuffer) {
         return Message.parseMessage(Time, data);
      }

      parse(data: ArrayBuffer) {
         let bytes = new ByteArray(data);
         let time = bytes.getNumber();
         this.data = time ? new Date(time) : undefined;
         return this;
      }

      stringify() {
         let bytes = new ByteArray();
         let time = this.data ? this.data.getTime() : undefined;
         bytes.addNumber(time);
         return bytes.getArrayBuffer();
      }
   }
}

export default Message;

/** @format */

import TextEncoder from './TextEncoder.js';
import TextDecoder from './TextDecoder.js';

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
         if (data.byteLength === 0) {
            this.data = undefined;
         } else {
            let textDecoder = new TextDecoder();
            this.data = textDecoder.decode(new Uint8Array(data.slice(0, data.byteLength - 1)));
         }
         return this;
      }

      stringify() {
         let textEncoder = new TextEncoder();
         return textEncoder.encode(this.data === undefined ? '' : this.data + '\0').buffer;
      }
   }
   // eslint-disable-next-line id-blacklist
   export class Boolean extends Data<boolean> {
      static parse(data: string | ArrayBuffer) {
         return Message.parseMessage(Boolean, data);
      }

      parse(data: ArrayBuffer) {
         let view = new DataView(data);
         let value = view.getUint8(0);
         this.data = value === 2 ? undefined : value === 1;
         return this;
      }

      stringify() {
         let buffer = new ArrayBuffer(8);
         let view = new DataView(buffer);
         view.setUint8(0, this.data === undefined ? 2 : (this.data ? 1 : 0));
         return buffer;
      }
   }
   // eslint-disable-next-line id-blacklist
   export class Number extends Data<number> {
      static parse(data: string | ArrayBuffer) {
         return Message.parseMessage(Number, data);
      }

      parse(data: ArrayBuffer) {
         let view = new DataView(data);
         let value = view.getFloat64(0);
         this.data = isNaN(value) ? undefined : value;
         return this;
      }

      stringify() {
         let buffer = new ArrayBuffer(8);
         let view = new DataView(buffer);
         view.setFloat64(0, this.data === undefined ? NaN : this.data);
         return buffer;
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
         let view = new DataView(data);
         let time = view.getFloat64(0) || undefined;
         this.data = time ? new Date(time) : undefined;
         return this;
      }

      stringify() {
         let time = this.data ? this.data.getTime() : 0;
         let buffer = new ArrayBuffer(8);
         let view = new DataView(buffer);
         view.setFloat64(0, time);
         return buffer;
      }
   }
}

export default Message;

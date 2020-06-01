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
}

export class Bool extends Message {
   constructor(public data?: boolean) {
      super();
   }

   static parse(data: string | ArrayBuffer) {
      return Message.parseMessage(Bool, data);
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

export class Double extends Message {
   constructor(public data?: number) {
      super();
   }

   static parse(data: string | ArrayBuffer) {
      return Message.parseMessage(Double, data);
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

export class Text extends Message {
   constructor(public data?: string) {
      super();
   }

   static parse(data: string | ArrayBuffer) {
      return Message.parseMessage(Text, data);
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

export class Time extends Message {
   data?: Date;

   constructor(data?: Date) {
      super();
      // Make a copy
      this.data = data ? new Date(data.getTime()) : undefined;
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

// Special data implementation
export class Json<U> extends Message {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   protected schema: Record<keyof U, boolean | ((write: boolean, value: any) => any)>;

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   static dateSerializer(write: boolean, value: any) {
      if (write) {
         return value !== undefined ? value.getTime() : undefined;
      } else {
         return value !== undefined ? new Date(value) : undefined;
      }
   }

   parse(data: string | ArrayBuffer) {
      if (typeof (data) !== 'string') {
         throw new Error('ArrayBuffer not support for generic data!');
      }
      let json = Message.fromJSON(data);
      let entries = Object.entries(this.schema);
      entries.forEach(([key, value]) => {
         if (value === true) {
            // Copy as is
            this[key] = json[key];
         }
         if (typeof value === 'function') {
            this[key] = value(false, json[key]);
         }
      });
      return this;
   }

   stringify(): string | ArrayBuffer {
      let json = {};
      let entries = Object.entries(this.schema);
      entries.forEach(([key, value]) => {
         if (value === true) {
            // Copy as is
            json[key] = this[key];
         }
         if (typeof value === 'function') {
            json[key] = value(true, this[key]);
         }
      });
      return Message.toJSON(json);
   }
}

export default Message;

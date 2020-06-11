/** @format */

import ByteArray from './ByteArray.js';

export interface IMessageFactory<T> {
   pack: (data?: T) => Message;
   unpack: (msg: Message) => T | undefined;
}

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

   export function parseFactory<T>(factory: IMessageFactory<T>, data: string | ArrayBuffer) {
      let msg = factory.pack();
      return msg.parse(data);
   }
}

export class Void extends Message {
   static Msg: IMessageFactory<void> = {
      pack: () => new Void(),
      unpack: () => undefined
   };

   constructor() {
      super();
   }

   static parse(data: string | ArrayBuffer) {
      return Message.parseMessage(Void, data);
   }

   parse(data: ArrayBuffer) {
      return this;
   }

   stringify() {
      let bytes = new ByteArray();
      return bytes.getArrayBuffer();
   }
}

export class Bool extends Message {
   static Msg: IMessageFactory<boolean> = {
      pack: (value) => new Bool(value),
      unpack: (msg: Bool) => msg.data
   };

   constructor(public data?: boolean) {
      super();
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
   static Msg: IMessageFactory<number> = {
      pack: (value) => new Double(value),
      unpack: (msg: Double) => msg.data
   };

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
   static Msg: IMessageFactory<string> = {
      pack: (value) => new Text(value),
      unpack: (msg: Text) => msg.data
   };

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
   static Msg: IMessageFactory<Date> = {
      pack: (value) => new Time(value),
      unpack: (msg: Time) => msg.data
   };

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Schema<U> = Record<keyof U, boolean | ((write: boolean, value: any) => any)>;

// Special data implementation
export class Json<U> extends Message {
   data?: U;

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   schema: Schema<U>;

   constructor(schema: Schema<U>, data?: U) {
      super();
      // Set the values (no copy)
      this.data = data;
      this.schema = schema;
   }

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
      if (json === undefined) {
         this.data = undefined;
      } else {
         let entries = Object.entries(this.schema);
         if (!this.data) {
            this.data = {} as U;
         }
         let object = this.data;
         let assign = (key: string, value: unknown) => {
            if (value !== undefined) {
               object[key] = value;
            }
         };
         entries.forEach(([key, value]) => {
            if (value === true) {
               // Copy as is
               assign(key, json[key]);
            }
            if (typeof value === 'function') {
               assign(key, value(false, json[key]));
            }
         });
      }
      return this;
   }

   stringify(): string | ArrayBuffer {
      let json = {};
      let entries = Object.entries(this.schema);
      if (this.data) {
         let object = this.data;
         let assign = (key: string, value: unknown) => {
            if (value !== undefined) {
               json[key] = value;
            }
         };
         entries.forEach(([key, value]) => {
            if (value === true) {
               // Copy as is
               assign(key, object[key]);
            }
            if (typeof value === 'function') {
               assign(key, value(true, object[key]));
            }
         });
      }
      return Message.toJSON(this.data === undefined ? undefined : json);
   }
}

export default Message;

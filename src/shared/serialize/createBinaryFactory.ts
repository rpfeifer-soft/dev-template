/** @format */

import { Message, IMessagesFactory, IMessageFactory } from './Message.js';
import { ByteArray } from './ByteArray.js';

// Special data implementation
class Binary<TClass> extends Message {
   data?: TClass;

   ctor: () => TClass;

   readFrom: (bytes: ByteArray, data: TClass, opt: (key: string) => void) => void;
   writeTo: (data: TClass, bytes: ByteArray) => void;

   constructor(
      ctor: () => TClass,
      readFrom: (bytes: ByteArray, data: TClass, opt: (key: string) => void) => void,
      writeTo: (data: TClass, bytes: ByteArray) => void,
      data?: TClass
   ) {
      super();
      // Set the values (no copy)
      this.ctor = ctor;
      this.readFrom = readFrom;
      this.writeTo = writeTo;
      this.data = data;
   }

   dClean(key: string) {
      if (this.data && this.data[key] === undefined) {
         delete (this.data[key]);
      }
   }

   parse(data: string | ArrayBuffer | ByteArray) {
      if (typeof (data) === 'string') {
         throw new TypeError('String not support for generic data!');
      }
      const bytes = data instanceof ByteArray ? data : new ByteArray(data);
      const empty = bytes.getBoolean();
      if (empty) {
         this.data = undefined;
      } else {
         this.data = this.ctor();
         this.readFrom(bytes, this.data, (key) => this.dClean(key));
      }
      return this;
   }

   stringify() {
      const bytes = new ByteArray();
      bytes.addBoolean(this.data ? false : true);
      if (this.data) {
         this.writeTo(this.data, bytes);
      }
      return bytes.getArrayBuffer();
   }
}

// Support array
class BinaryArrayClass<TClass> extends Message {
   data?: TClass[];

   factory: IMessageFactory<TClass>;

   constructor(
      factory: IMessageFactory<TClass>,
      data?: TClass[]
   ) {
      super();

      this.factory = factory;
      this.data = data;
   }

   parse(data: ArrayBuffer) {
      const bytes = new ByteArray(data);
      this.data = bytes.getArray(() => {
         const msg = this.factory.pack();
         msg.parse(bytes);
         return this.factory.unpack(msg);
      });
      return this;
   }

   stringify() {
      const bytes = new ByteArray();
      bytes.addArray(this.data, (item) => {
         const msg = this.factory.pack(item);
         const buffer = msg.stringify();
         if (typeof (buffer) === 'string') {
            throw new TypeError('Unsupported serialization type: Binary expected!');
         }
         bytes.addBuffer(buffer);
      });
      return bytes.getArrayBuffer();
   }
}

export function createBinaryFactory<TClass>(
   ctor: (() => TClass),
   readFrom: (bytes: ByteArray, data: TClass, opt: (key: string) => void) => void,
   writeTo: (data: TClass, bytes: ByteArray) => void
): IMessagesFactory<TClass> {
   const factory: IMessagesFactory<TClass> = {
      pack: (value) => new Binary<TClass>(ctor, readFrom, writeTo, value),
      unpack: (msg: Binary<TClass>) => msg.data,
      array: {
         pack: (value) => new BinaryArrayClass<TClass>(factory, value),
         unpack: (msg: BinaryArrayClass<TClass>) => msg.data
      }
   };
   return factory;
}

/** @format */

import Message from './Message.js';
import ByteArray from '../ByteArray.js';

// Special data implementation
class Binary<TClass> extends Message {
   data?: TClass;

   ctor: new () => TClass;

   readFrom: (bytes: ByteArray, data: TClass, opt: (key: string) => void) => void;
   writeTo: (data: TClass, bytes: ByteArray) => void;

   constructor(
      ctor: new () => TClass,
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

   parse(data: string | ArrayBuffer) {
      if (typeof (data) === 'string') {
         throw new Error('String not support for generic data!');
      }
      let bytes = new ByteArray(data);
      let empty = bytes.getBoolean();
      if (empty) {
         this.data = undefined;
      } else {
         this.data = new this.ctor;
         this.readFrom(bytes, this.data, (key) => this.dClean(key));
      }
      return this;
   }

   stringify(): string | ArrayBuffer {
      let bytes = new ByteArray();
      bytes.addBoolean(this.data ? false : true);
      if (this.data) {
         this.writeTo(this.data, bytes);
      }
      return bytes.getArrayBuffer();
   }
}

function createBinaryFactory<TClass>(
   ctor: (new () => TClass),
   readFrom: (bytes: ByteArray, data: TClass, opt: (key: string) => void) => void,
   writeTo: (data: TClass, bytes: ByteArray) => void
) {
   let factory: Message.IMessageFactory<TClass> = {
      pack: (value) => new Binary<TClass>(ctor, readFrom, writeTo, value),
      unpack: (msg: Binary<TClass>) => msg.data
   };
   return factory;
};

export default createBinaryFactory;
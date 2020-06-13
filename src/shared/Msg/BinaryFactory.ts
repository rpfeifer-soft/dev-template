/** @format */

import Message from './Message.js';
import ByteArray from '../ByteArray.js';

// Special data implementation
abstract class Binary<TClass> extends Message {
   data?: TClass;

   ctor: new () => TClass;

   constructor(ctor: new () => TClass, data?: TClass) {
      super();
      // Set the values (no copy)
      this.ctor = ctor;
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
         this.readFrom(bytes, this.data);
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

   abstract readFrom(bytes: ByteArray, data: TClass): void;
   abstract writeTo(data: TClass, bytes: ByteArray): void;
}

export default Binary;
/** @format */

import ByteArray from '../ByteArray.js';
import Message from './Message.js';

class BoolClass extends Message {
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

class BoolArrayClass extends Message {
   constructor(public data?: boolean[]) {
      super();
   }

   parse(data: ArrayBuffer) {
      let bytes = new ByteArray(data);
      this.data = bytes.getArray(() => bytes.getBoolean());
      return this;
   }

   stringify() {
      let bytes = new ByteArray();
      bytes.addArray(this.data, (item) => bytes.addBoolean(item));
      return bytes.getArrayBuffer();
   }
}

export const fBool: Message.IMessagesFactory<boolean> = {
   pack: (value) => new BoolClass(value),
   unpack: (msg: BoolClass) => msg.data,
   array: {
      pack: (value) => new BoolArrayClass(value),
      unpack: (msg: BoolArrayClass) => msg.data,
   }
};

/** @format */

import ByteArray from '../ByteArray.js';
import Message from './Message.js';

class StringClass extends Message {
   constructor(public data?: string) {
      super();
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

class StringArrayClass extends Message {
   constructor(public data?: string[]) {
      super();
   }

   parse(data: ArrayBuffer) {
      let bytes = new ByteArray(data);
      this.data = bytes.getArray(() => bytes.getString());
      return this;
   }

   stringify() {
      let bytes = new ByteArray();
      bytes.addArray(this.data, (item) => bytes.addString(item));
      return bytes.getArrayBuffer();
   }
}

const fString: Message.IMessagesFactory<string> = {
   pack: (value) => new StringClass(value),
   unpack: (msg: StringClass) => msg.data,
   array: {
      pack: (value) => new StringArrayClass(value),
      unpack: (msg: StringArrayClass) => msg.data,
   }
};

export default fString;
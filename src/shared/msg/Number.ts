/** @format */

import ByteArray from '../ByteArray.js';
import Message from './Message.js';

class NumberClass extends Message {
   constructor(public data?: number) {
      super();
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

class NumberArrayClass extends Message {
   constructor(public data?: number[]) {
      super();
   }

   parse(data: ArrayBuffer) {
      let bytes = new ByteArray(data);
      this.data = bytes.getArray(() => bytes.getNumber());
      return this;
   }

   stringify() {
      let bytes = new ByteArray();
      bytes.addArray(this.data, (item) => bytes.addNumber(item));
      return bytes.getArrayBuffer();
   }
}

const fNumber: Message.IMessagesFactory<number> = {
   pack: (value) => new NumberClass(value),
   unpack: (msg: NumberClass) => msg.data,
   array: {
      pack: (value) => new NumberArrayClass(value),
      unpack: (msg: NumberArrayClass) => msg.data,
   }
};

export default fNumber;
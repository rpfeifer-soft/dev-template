/** @format */

import { ByteArray } from './ByteArray.js';
import { Message, IMessagesFactory } from './Message.js';

class NumberClass extends Message {
   constructor(public data?: number) {
      super();
   }

   parse(data: ArrayBuffer) {
      const bytes = new ByteArray(data);
      this.data = bytes.getNumber();
      return this;
   }

   stringify() {
      const bytes = new ByteArray();
      bytes.addNumber(this.data);
      return bytes.getArrayBuffer();
   }
}

class NumberArrayClass extends Message {
   constructor(public data?: number[]) {
      super();
   }

   parse(data: ArrayBuffer) {
      const bytes = new ByteArray(data);
      this.data = bytes.getArray(() => bytes.getNumber());
      return this;
   }

   stringify() {
      const bytes = new ByteArray();
      bytes.addArray(this.data, (item) => bytes.addNumber(item));
      return bytes.getArrayBuffer();
   }
}

export const fNumber: IMessagesFactory<number> = {
   pack: (value) => new NumberClass(value),
   unpack: (msg: NumberClass) => msg.data,
   array: <IMessagesFactory<number[]>>{
      pack: (value) => new NumberArrayClass(value),
      unpack: (msg: NumberArrayClass) => msg.data,
   }
};

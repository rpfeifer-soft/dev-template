/** @format */

import ByteArray from '../ByteArray.js';
import Message, { IMessageFactory } from './Message.js';

class NumberClass extends Message {
   static Msg: IMessageFactory<number> = {
      pack: (value) => new NumberClass(value),
      unpack: (msg: NumberClass) => msg.data
   };

   constructor(public data?: number) {
      super();
   }

   static parse(data: string | ArrayBuffer) {
      return Message.parseMessage(NumberClass, data);
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
const fNumber = NumberClass.Msg;

export default fNumber;
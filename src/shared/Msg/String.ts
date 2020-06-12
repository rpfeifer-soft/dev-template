/** @format */

import ByteArray from '../ByteArray.js';
import Message from './Message.js';

class StringClass extends Message {
   static Msg: Message.IMessageFactory<string> = {
      pack: (value) => new StringClass(value),
      unpack: (msg: StringClass) => msg.data
   };

   constructor(public data?: string) {
      super();
   }

   static parse(data: string | ArrayBuffer) {
      return Message.parseMessage(StringClass, data);
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
const fString = StringClass.Msg;

export default fString;
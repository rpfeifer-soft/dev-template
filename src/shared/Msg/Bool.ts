/** @format */

import ByteArray from '../ByteArray.js';
import Message from './Message.js';

class BoolClass extends Message {
   static Msg: Message.IMessageFactory<boolean> = {
      pack: (value) => new BoolClass(value),
      unpack: (msg: BoolClass) => msg.data
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
const fBool = BoolClass.Msg;

export default fBool;
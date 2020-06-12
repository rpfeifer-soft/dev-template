/** @format */

import ByteArray from '../ByteArray.js';
import Message from './Message.js';

class VoidClass extends Message {
   static Msg: Message.IMessageFactory<void> = {
      pack: () => new VoidClass(),
      unpack: () => undefined
   };

   constructor() {
      super();
   }

   static parse(data: string | ArrayBuffer) {
      return Message.parseMessage(VoidClass, data);
   }

   parse(data: ArrayBuffer) {
      return this;
   }

   stringify() {
      let bytes = new ByteArray();
      return bytes.getArrayBuffer();
   }
}
const fVoid = VoidClass.Msg;

export default fVoid;
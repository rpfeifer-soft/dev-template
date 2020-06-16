/** @format */

import ByteArray from '../ByteArray.js';
import { Message } from './Message.js';

class VoidClass extends Message {
   parse(data: ArrayBuffer) {
      return this;
   }

   stringify() {
      let bytes = new ByteArray();
      return bytes.getArrayBuffer();
   }
}

export const fVoid: Message.IMessageFactory<void> = {
   pack: () => new VoidClass(),
   unpack: () => undefined
};

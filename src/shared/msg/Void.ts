/** @format */

import ByteArray from '../ByteArray.js';
import Message from './Message.js';

class VoidClass extends Message {
   parse(data: ArrayBuffer) {
      return this;
   }

   stringify() {
      let bytes = new ByteArray();
      return bytes.getArrayBuffer();
   }
}

const fVoid: Message.IMessageFactory<void> = {
   pack: () => new VoidClass(),
   unpack: () => undefined
};

export default fVoid;
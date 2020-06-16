/** @format */

import { ByteArray } from './ByteArray.js';
import { Message, IMessageFactory } from './Message.js';

class VoidClass extends Message {
   parse(data: ArrayBuffer) {
      return this;
   }

   stringify() {
      let bytes = new ByteArray();
      return bytes.getArrayBuffer();
   }
}

export const fVoid: IMessageFactory<void> = {
   pack: () => new VoidClass(),
   unpack: () => undefined
};

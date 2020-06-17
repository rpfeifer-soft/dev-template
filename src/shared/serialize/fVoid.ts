/** @format */

import { ByteArray } from './ByteArray.js';
import { Message, IMessageFactory } from './Message.js';

class VoidClass extends Message {
   parse() {
      return this;
   }

   stringify() {
      const bytes = new ByteArray();
      return bytes.getArrayBuffer();
   }
}

export const fVoid: IMessageFactory<void> = {
   pack: () => new VoidClass(),
   unpack: () => undefined
};

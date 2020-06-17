/** @format */

import { ByteArray } from './ByteArray.js';
import { Message, IMessagesFactory } from './Message.js';

class BoolClass extends Message {
   constructor(public data?: boolean) {
      super();
   }

   parse(data: ArrayBuffer) {
      const bytes = new ByteArray(data);
      this.data = bytes.getBoolean();
      return this;
   }

   stringify() {
      const bytes = new ByteArray();
      bytes.addBoolean(this.data);
      return bytes.getArrayBuffer();
   }
}

class BoolArrayClass extends Message {
   constructor(public data?: boolean[]) {
      super();
   }

   parse(data: ArrayBuffer) {
      const bytes = new ByteArray(data);
      this.data = bytes.getArray(() => bytes.getBoolean());
      return this;
   }

   stringify() {
      const bytes = new ByteArray();
      bytes.addArray(this.data, (item) => bytes.addBoolean(item));
      return bytes.getArrayBuffer();
   }
}

export const fBool: IMessagesFactory<boolean> = {
   pack: (value) => new BoolClass(value),
   unpack: (msg: BoolClass) => msg.data,
   array: <IMessagesFactory<boolean[]>>{
      pack: (value) => new BoolArrayClass(value),
      unpack: (msg: BoolArrayClass) => msg.data,
   }
};

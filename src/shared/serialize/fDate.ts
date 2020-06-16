/** @format */

import ByteArray from '../ByteArray.js';
import { Message } from './Message.js';

class DateClass extends Message {
   data?: Date;

   constructor(data?: Date) {
      super();
      // Make a copy
      this.data = data ? new Date(data.getTime()) : undefined;
   }

   parse(data: ArrayBuffer) {
      let bytes = new ByteArray(data);
      this.data = bytes.getDate();
      return this;
   }

   stringify() {
      let bytes = new ByteArray();
      bytes.addDate(this.data);
      return bytes.getArrayBuffer();
   }
}

class DateArrayClass extends Message {
   constructor(public data?: Date[]) {
      super();
   }

   parse(data: ArrayBuffer) {
      let bytes = new ByteArray(data);
      this.data = bytes.getArray(() => bytes.getDate());
      return this;
   }

   stringify() {
      let bytes = new ByteArray();
      bytes.addArray(this.data, (item) => bytes.addDate(item));
      return bytes.getArrayBuffer();
   }
}

export const fDate: Message.IMessagesFactory<Date> = {
   pack: (value) => new DateClass(value),
   unpack: (msg: DateClass) => msg.data,
   array: {
      pack: (value) => new DateArrayClass(value),
      unpack: (msg: DateArrayClass) => msg.data,
   }
};

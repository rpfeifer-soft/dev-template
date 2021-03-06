/** @format */

import { ByteArray } from './ByteArray.js';
import { Message, IMessagesFactory } from './Message.js';

class DateClass extends Message {
   data?: Date;

   constructor(data?: Date) {
      super();
      // Make a copy
      this.data = data ? new Date(data.getTime()) : undefined;
   }

   parse(data: ArrayBuffer) {
      const bytes = new ByteArray(data);
      this.data = bytes.getDate();
      return this;
   }

   stringify() {
      const bytes = new ByteArray();
      bytes.addDate(this.data);
      return bytes.getArrayBuffer();
   }
}

class DateArrayClass extends Message {
   constructor(public data?: Date[]) {
      super();
   }

   parse(data: ArrayBuffer) {
      const bytes = new ByteArray(data);
      this.data = bytes.getArray(() => bytes.getDate());
      return this;
   }

   stringify() {
      const bytes = new ByteArray();
      bytes.addArray(this.data, (item) => bytes.addDate(item));
      return bytes.getArrayBuffer();
   }
}

export const fDate: IMessagesFactory<Date> = {
   pack: (value) => new DateClass(value),
   unpack: (msg: DateClass) => msg.data,
   array: <IMessagesFactory<Date[]>>{
      pack: (value) => new DateArrayClass(value),
      unpack: (msg: DateArrayClass) => msg.data,
   }
};

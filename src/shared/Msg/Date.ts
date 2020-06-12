/** @format */

import ByteArray from '../ByteArray.js';
import Message, { IMessageFactory } from './Message.js';

class DateClass extends Message {
   static Msg: IMessageFactory<Date> = {
      pack: (value) => new DateClass(value),
      unpack: (msg: DateClass) => msg.data
   };

   data?: Date;

   constructor(data?: Date) {
      super();
      // Make a copy
      this.data = data ? new Date(data.getTime()) : undefined;
   }

   static parse(data: string | ArrayBuffer) {
      return Message.parseMessage(DateClass, data);
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
const fDate = DateClass.Msg;

export default fDate;
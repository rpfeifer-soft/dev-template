/** @format */

import Message, { Json, IMessageFactory } from '../Msg/Message.js';
import ByteArray from '../ByteArray.js';

interface IInit {
   url: string;
   browser?: string;
   time?: Date;
   test?: string;
}

interface Init extends IInit { };
class Init {
   constructor(url: string = '', browser?: string, time?: Date) {
      this.url = url;
      this.browser = browser || '';
      this.time = time;
   }

   dump() {
      // eslint-disable-next-line no-console
      console.log(this.time, this.browser);
   }
};
export default Init;

class JsonInit extends Json<Init, IInit> { };
export const jInit: IMessageFactory<Init> = {
   pack: (value) => new JsonInit([Init, {
      url: true,
      browser: true,
      time: Json.dateSerializer,
      test: true
   }], value),
   unpack: (msg: JsonInit) => msg.data
};

class InitBinary extends Message {
   constructor(public data?: Init) {
      super();
   }
   parse(data: ArrayBuffer): this {
      let bytes = new ByteArray(data);
      let empty = bytes.getBoolean();
      let dClean = (key: string) => this.data && this.data[key] === undefined ? delete (this.data[key]) : undefined;
      if (empty) {
         this.data = undefined;
      } else {
         this.data = new Init();
         this.data.url = bytes.getString() || '';
         this.data.browser = bytes.getString(); dClean('browser');
         this.data.time = bytes.getDate();
         this.data.test = bytes.getString(); dClean('test');
      }
      return this;
   }
   stringify() {
      let bytes = new ByteArray();
      bytes.addBoolean(this.data ? false : true);
      if (this.data) {
         bytes.addString(this.data.url);
         bytes.addString(this.data.browser);
         bytes.addDate(this.data.time);
         bytes.addString(this.data.test);
      }
      return bytes.getArrayBuffer();
   }
}
export const fInit: IMessageFactory<Init> = {
   pack: (value) => new InitBinary(value),
   unpack: (msg: InitBinary) => msg.data
};

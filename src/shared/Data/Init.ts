/** @format */

import Message from '../Msg/Message.js';
import Json from '../Msg/Json.js';

interface IInit {
   url: string;
   browser?: string;
   time?: Date;
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
export const fInit: Message.IMessageFactory<Init> = {
   pack: (value) => new JsonInit([Init, {
      url: true,
      browser: true,
      time: Json.dateSerializer
   }], value),
   unpack: (msg: JsonInit) => msg.data
};
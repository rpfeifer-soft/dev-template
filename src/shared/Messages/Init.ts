/** @format */

import { Json, IMessageFactory } from '../Message.js';

interface IInit {
   url: string;
   browser: string;
   time: Date;
   test?: string;
}
export const fInit: IMessageFactory<Init> = {
   pack: (value) => new Json({
      url: true,
      browser: true,
      time: Json.dateSerializer,
      test: true
   }, value),
   unpack: (msg: Json<Init>) => msg.data
};

interface Init extends IInit { };
class Init {
};

export default Init;

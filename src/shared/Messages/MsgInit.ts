/** @format */

import { Json, IMessageFactory } from '../Message.js';

interface IInit {
   url: string;
   browser: string;
   time: Date;
   test?: string;
}

interface Init extends IInit { };
class Init {
   static Msg: IMessageFactory<Init> = {
      pack: (value) => new Json({
         url: true,
         browser: true,
         time: Json.dateSerializer,
         test: true
      }, value),
      unpack: (msg: Json<Init>) => msg.data
   };
};

export default Init;

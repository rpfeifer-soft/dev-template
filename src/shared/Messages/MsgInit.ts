/** @format */

import { Json } from '../Message.js';

interface IMsgInit {
   url: string;
   browser: string;
   time: Date;
}

interface MsgInit extends IMsgInit { };
class MsgInit extends Json<IMsgInit> {
   schema = {
      url: true,
      browser: true,
      time: MsgInit.dateSerializer
   };

   static parse(data: string | ArrayBuffer) {
      return MsgInit.parseMessage(MsgInit, data);
   }
};

export default MsgInit;

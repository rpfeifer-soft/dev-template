/** @format */

import createJsonFactory, { jsonDateSerializer } from '../Msg/JsonFactory.js';

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

export const fInit = createJsonFactory<Init, IInit>(Init, {
   url: true,
   browser: true,
   time: jsonDateSerializer
});

/** @format */

import { ServerFunctions, ServerFunction } from '../communication-api.js';
import { Message } from '../serialize/Message.js';

type InitReturn = ServerFunctions.Returns<ServerFunction.Connect> extends undefined
   ? void
   : Promise<Message>;

export interface IClientHandler {

   initServer: (url: string, ctor: () => Message, msgInit: Message) => InitReturn;

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClientConstructor = new (...args: any[]) => IClientHandler;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function applyInitForClient<TBase extends ClientConstructor>(Base: TBase) {

   type ReturnArg<T> = ServerFunctions.Returns<T> extends void
      ? void : Promise<ServerFunctions.Returns<T>>;

   return class extends Base {

      init(url: string, data: ServerFunctions.Parameter<ServerFunction.Connect>): ReturnArg<ServerFunction.Connect>;
      init(url: string, data: unknown): unknown {
         const factoryParam = ServerFunctions.getParameter(ServerFunction.Connect);
         const factoryReturn = ServerFunctions.getReturns(ServerFunction.Connect);

         const msg = factoryParam.pack(data);

         if (!factoryReturn) {
            return;
         }
         const pack = factoryReturn.pack;
         const ctor = () => pack();

         return this.initServer(url, ctor, msg)
            .then(resultMsg => factoryReturn ? factoryReturn.unpack(resultMsg) : resultMsg);
      }
   };
}

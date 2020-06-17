/** @format */

import { ServerFunction, Returns, Parameter, getParameter, getReturns } from '../apiServer.js';
import { Message } from '../serialize/Message.js';

export interface IClientHandler {
   initServer: (
      url: string,
      ctor: () => Message, msgInit: Message
   ) => (Returns<ServerFunction.Connect> extends undefined
      ? void
      : Promise<Message>);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClientConstructor = new (...args: any[]) => IClientHandler;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function applyInitForClient<TBase extends ClientConstructor>(Base: TBase) {

   type ReturnArg<T> = Returns<T> extends void
      ? void : Promise<Returns<T>>;

   return class extends Base {

      init(url: string, data: Parameter<ServerFunction.Connect>): ReturnArg<ServerFunction.Connect>;
      init(url: string, data: unknown): unknown {
         const factoryParam = getParameter(ServerFunction.Connect);
         const factoryReturn = getReturns(ServerFunction.Connect);

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

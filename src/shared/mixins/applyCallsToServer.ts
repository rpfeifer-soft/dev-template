/** @format */

import { ServerFunction, Parameter, Returns, getParameter, getReturns } from '../apiServer.js';
import { ISender } from '../Sender.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SenderServerConstructor = new (...args: any[]) => ISender<ServerFunction>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function applyCallsToServer<TBase extends SenderServerConstructor>(Base: TBase) {

   type CallArgs<T> = Parameter<T> extends void
      ? [T] : [T, Parameter<T>];
   type ReturnArg<T> = Returns<T> extends void
      ? void : Promise<Returns<T>>;

   return class extends Base {
      // FUNCTIONS
      call(...args: CallArgs<ServerFunction.Connect>): ReturnArg<ServerFunction.Connect>;
      call(...args: CallArgs<ServerFunction.GetClientInfos>): ReturnArg<ServerFunction.GetClientInfos>;
      call(...args: CallArgs<ServerFunction.SetUser>): ReturnArg<ServerFunction.SetUser>;
      call(...args: CallArgs<ServerFunction.SetLanguage>): ReturnArg<ServerFunction.SetLanguage>;
      call(...args: CallArgs<ServerFunction.SendAuthCode>): ReturnArg<ServerFunction.SendAuthCode>;
      call(...args: CallArgs<ServerFunction.Login>): ReturnArg<ServerFunction.Login>;
      call(...args: CallArgs<ServerFunction.Logoff>): ReturnArg<ServerFunction.Logoff>;

      call(type: ServerFunction, data?: unknown): Promise<unknown> | void {
         const factoryParam = getParameter(type);
         const factoryReturn = getReturns(type);

         const msg = factoryParam.pack(data);

         if (factoryReturn) {
            const pack = factoryReturn.pack;
            const unpack = factoryReturn.unpack;
            const ctorReturnType = () => pack();
            return this.sendFunction(ctorReturnType, type, msg)
               .then(resultMsg => unpack(resultMsg));
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}


/** @format */

import { ServerFunctions, ServerFunction } from '../communication-api.js';
import { ISender } from '../Sender.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerServerConstructor = new (...args: any[]) => ISender<ServerFunction>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function applyCallsToServer<TBase extends ServerServerConstructor>(Base: TBase) {

   type CallArgs<T> = ServerFunctions.Parameter<T> extends void
      ? [T] : [T, ServerFunctions.Parameter<T>];
   type ReturnArg<T> = ServerFunctions.Returns<T> extends void
      ? void : Promise<ServerFunctions.Returns<T>>;

   return class extends Base {
      // FUNCTIONS
      call(...args: CallArgs<ServerFunction.Connect>): ReturnArg<ServerFunction.Connect>;
      call(...args: CallArgs<ServerFunction.GetClientInfos>): ReturnArg<ServerFunction.GetClientInfos>;
      call(...args: CallArgs<ServerFunction.SetUser>): ReturnArg<ServerFunction.SetUser>;
      call(...args: CallArgs<ServerFunction.SendAuthCode>): ReturnArg<ServerFunction.SendAuthCode>;
      call(...args: CallArgs<ServerFunction.Login>): ReturnArg<ServerFunction.Login>;
      call(...args: CallArgs<ServerFunction.Logoff>): ReturnArg<ServerFunction.Logoff>;

      call(type: ServerFunction, data?: unknown): Promise<unknown> | void {
         const factoryParam = ServerFunctions.getParameter(type);
         const factoryReturn = ServerFunctions.getReturns(type);

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


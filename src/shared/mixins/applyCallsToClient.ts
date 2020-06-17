/** @format */

import { ClientFunction, Parameter, Returns, getParameter, getReturns } from '../apiClient.js';
import { ISender } from '../Sender.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SenderClientConstructor = new (...args: any[]) => ISender<ClientFunction>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function applyCallsToClient<TBase extends SenderClientConstructor>(Base: TBase) {

   type CallArgs<T> = Parameter<T> extends void
      ? [T] : [T, Parameter<T>];
   type ReturnArg<T> = Returns<T> extends void
      ? void : Promise<Returns<T>>;

   return class extends Base {
      // FUNCTIONS
      call(...args: CallArgs<ClientFunction.GetVersion>): ReturnArg<ClientFunction.GetVersion>;
      call(...args: CallArgs<ClientFunction.ClientChanged>): ReturnArg<ClientFunction.ClientChanged>;
      call(...args: CallArgs<ClientFunction.ClientsRemoved>): ReturnArg<ClientFunction.ClientsRemoved>;

      call(type: ClientFunction, data?: unknown): Promise<unknown> | void {
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


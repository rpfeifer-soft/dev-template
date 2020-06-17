/** @format */

import { ClientFunctions, ClientFunction } from '../communication-api.js';
import { ISender } from '../Sender.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SenderClientConstructor = new (...args: any[]) => ISender<ClientFunction>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function applyCallsToClient<TBase extends SenderClientConstructor>(Base: TBase) {

   type CallArgs<T> = ClientFunctions.Parameter<T> extends void
      ? [T] : [T, ClientFunctions.Parameter<T>];
   type ReturnArg<T> = ClientFunctions.Returns<T> extends void
      ? void : Promise<ClientFunctions.Returns<T>>;

   return class extends Base {
      // FUNCTIONS
      call(...args: CallArgs<ClientFunction.GetVersion>): ReturnArg<ClientFunction.GetVersion>;
      call(...args: CallArgs<ClientFunction.ClientChanged>): ReturnArg<ClientFunction.ClientChanged>;
      call(...args: CallArgs<ClientFunction.ClientsRemoved>): ReturnArg<ClientFunction.ClientsRemoved>;

      call(type: ClientFunction, data?: unknown): Promise<unknown> | void {
         const factoryParam = ClientFunctions.getParameter(type);
         const factoryReturn = ClientFunctions.getReturns(type);

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


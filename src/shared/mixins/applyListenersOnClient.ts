/** @format */

import { ClientFunction, ClientFunctions } from '../communication-api.js';
import { Message } from '../serialize/Message.js';

export interface IClientHandler {

   onFunction: (
      type: ClientFunction,
      ctor: () => Message,
      handler: (msg: Message) => Promise<Message> | void
   ) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClientConstructor = new (...args: any[]) => IClientHandler;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function applyListenersOnClient<TBase extends ClientConstructor>(Base: TBase) {
   type Action<I> = (msg: I) => void;
   type Func<I, O> = (msg: I) => Promise<O>;

   type OnArgs<T> = [T, ClientFunctions.Returns<T> extends void
      ? Action<ClientFunctions.Parameter<T>>
      : Func<ClientFunctions.Parameter<T>, ClientFunctions.Returns<T>>
   ];

   return class extends Base {

      // FUNCTIONS
      on(...args: OnArgs<ClientFunction.GetVersion>): void;
      on(...args: OnArgs<ClientFunction.ClientChanged>): void;
      on(...args: OnArgs<ClientFunction.ClientsRemoved>): void;

      on(type: ClientFunction, handler: Func<unknown, unknown> | Action<unknown>): void {
         const factoryParam = ClientFunctions.getParameter(type);
         const factoryReturn = ClientFunctions.getReturns(type);

         const ctorParameter = () => factoryParam.pack();

         this.onFunction(type, ctorParameter, (data: Message) => {
            const promise = handler(factoryParam.unpack(data));
            if (!promise || !factoryReturn) {
               return;
            }
            const pack = factoryReturn.pack;
            return promise.then(msg => pack(msg));
         });
      }
   };
}

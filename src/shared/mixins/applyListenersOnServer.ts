/** @format */

import { ServerFunction, Returns, Parameter, getParameter, getReturns } from '../apiServer.js';
import { Message } from '../serialize/Message.js';

export interface IServerHandler<T> {
   onFunction: (
      type: ServerFunction,
      ctor: () => Message,
      handler: (msg: Message, client: T) => Promise<Message> | void
   ) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerConstructor<T> = new (...args: any[]) => IServerHandler<T>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function applyListenersOnServer<T, TBase extends ServerConstructor<T>>(Base: TBase) {
   type Action<I> = (msg: I, client: T) => void;
   type Func<I, O> = (msg: I, client: T) => Promise<O>;

   type OnArgs<T> = [T, Returns<T> extends void
      ? Action<Parameter<T>>
      : Func<Parameter<T>, Returns<T>>
   ];

   return class extends Base {
      // FUNCTIONS
      on(...args: OnArgs<ServerFunction.Connect>): void;
      on(...args: OnArgs<ServerFunction.GetClientInfos>): void;
      on(...args: OnArgs<ServerFunction.SetUser>): void;
      on(...args: OnArgs<ServerFunction.SendAuthCode>): void;
      on(...args: OnArgs<ServerFunction.Login>): void;
      on(...args: OnArgs<ServerFunction.Logoff>): void;

      on(type: ServerFunction, handler: Func<unknown, unknown> | Action<unknown>): void {
         const factoryParam = getParameter(type);
         const factoryReturn = getReturns(type);

         const ctorParameter = () => factoryParam.pack();

         this.onFunction(type, ctorParameter, (data: Message, client: T) => {
            const promise = handler(factoryParam.unpack(data), client);
            if (!promise || !factoryReturn) {
               return;
            }
            const pack = factoryReturn.pack;
            return promise.then(msg => pack(msg));
         });
      }
   };
}


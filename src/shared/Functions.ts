/* eslint-disable id-blacklist */
/** @format */

import Message from './Message.js';

function assertAllHandled(x: never): never {
   return x;
};

export enum ServerFunction {
   Init = 1,
   Click
}
export enum ServerMethod {
   Ping = 100
}

export enum ClientFunction {
   GetVersion = 1
}
export enum ClientMethod {
   Hello = 100,
   ClickFromClient
}

export function isServerFunction(value: ServerMethod | ServerFunction): value is ServerFunction {
   // eslint-disable-next-line default-case
   switch (value) {
      case ServerMethod.Ping:
         return false;

      case ServerFunction.Init:
      case ServerFunction.Click:
         return true;
   }
   assertAllHandled(value);
}

export function isClientFunction(value: ClientMethod | ClientFunction): value is ClientFunction {
   // eslint-disable-next-line default-case
   switch (value) {
      case ClientMethod.Hello:
      case ClientMethod.ClickFromClient:
         return false;

      case ClientFunction.GetVersion:
         return true;
   }
   assertAllHandled(value);
}

export interface IServerHandler<T> {
   onMethod: (
      type: ServerMethod,
      ctor: new () => Message,
      handler: (msg: Message, client: T) => void
   ) => void;

   onFunction: (
      type: ServerFunction,
      ctor: new () => Message,
      handler: (msg: Message, client: T) => Promise<Message>
   ) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MethodConstructor<T = {}> = new (...args: any[]) => T & IServerHandler<T>;

export function ImplementsServer<T>() {
   return function <TBase extends MethodConstructor>(Base: TBase) {
      return class extends Base {
         // METHODS
         on(type: ServerMethod.Ping, handler: (msg: Message.Boolean, client: T) => void): void;

         // FUNCTIONS
         on(type: ServerFunction.Init, handler: (msg: Message.String, client: T) => Promise<Message.String>): void;
         on(type: ServerFunction.Click, handler: (msg: Message.Time, client: T) => Promise<Message.Boolean>): void;

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         on(type: ServerMethod | ServerFunction, handler: any) {
            let ctor: new () => Message;
            switch (type) {
               case ServerMethod.Ping:
                  ctor = Message.Boolean;
                  break;

               case ServerFunction.Init:
                  ctor = Message.String;
                  break;
               case ServerFunction.Click:
                  ctor = Message.Time;
                  break;

               default:
                  assertAllHandled(type);
                  return;
            }
            if (isServerFunction(type)) {
               this.onFunction(type, ctor, handler);
            } else {
               this.onMethod(type, ctor, handler);
            }
         }
      };
   };
}

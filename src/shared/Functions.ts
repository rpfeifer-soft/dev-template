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

   broadcastMethod: (
      type: ClientMethod,
      msg: Message
   ) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerConstructor<T = {}> = new (...args: any[]) => T & IServerHandler<T>;

export function ImplementsServer<T>() {
   type Action<I> = (msg: I, client: T) => void;
   type Func<I, O> = (msg: I, client: T) => Promise<O>;

   return function <TBase extends ServerConstructor>(Base: TBase) {
      return class extends Base {
         // METHODS
         on(type: ServerMethod.Ping, handler: Action<Message.Boolean>): void;

         // FUNCTIONS
         on(type: ServerFunction.Init, handler: Func<Message.String, Message.String>): void;
         on(type: ServerFunction.Click, handler: Func<Message.Time, Message.Boolean>): void;

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         on(type: ServerMethod | ServerFunction, handler: any) {
            let ctorParameter: new () => Message;
            switch (type) {
               case ServerMethod.Ping:
                  ctorParameter = Message.Boolean;
                  break;

               case ServerFunction.Init:
                  ctorParameter = Message.String;
                  break;
               case ServerFunction.Click:
                  ctorParameter = Message.Time;
                  break;

               default:
                  assertAllHandled(type);
                  return;
            }
            if (isServerFunction(type)) {
               this.onFunction(type, ctorParameter, handler);
            } else {
               this.onMethod(type, ctorParameter, handler);
            }
         }

         broadcast(type: ClientMethod.Hello, msg: Message.String): void;
         broadcast(type: ClientMethod.ClickFromClient, msg: Message.Time): void;
         broadcast(type: ClientMethod, msg: Message) {
            this.broadcastMethod(type, msg);
         }
      };
   };
}

interface ISenderHandler<TMethod, TFunction> {
   pushMethod: (
      type: TMethod,
      msg: Message
   ) => void;

   sendFunction: (
      ctor: new () => Message,
      type: TFunction,
      msg: Message
   ) => Promise<Message>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerClientConstructor<T = {}> = new (...args: any[]) => T & ISenderHandler<ClientMethod, ClientFunction>;

export function ImplementsServerClient<TBase extends ServerClientConstructor>(Base: TBase) {
   return class extends Base {

      // METHODS
      call(type: ClientMethod.Hello, msg: Message.String): void;
      call(type: ClientMethod.ClickFromClient, msg: Message.Time): void;

      // FUNCTIONS
      call(type: ClientFunction.GetVersion, msg: Message.Boolean): Promise<Message.String>;

      call(type: ClientFunction | ClientMethod, msg: Message): Promise<Message> | void {
         if (isClientFunction(type)) {
            let ctorReturnType: new () => Message;
            switch (type) {
               case ClientFunction.GetVersion:
                  ctorReturnType = Message.String;
                  break;

               default:
                  assertAllHandled(type);
                  return;
            }
            return this.sendFunction(ctorReturnType, type, msg);
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}

export interface IClientHandler extends ISenderHandler<ServerMethod, ServerFunction> {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   initServer: (url: string, msgInit: Message) => any;

   onMethod: (
      type: ClientMethod,
      ctor: new () => Message,
      handler: (msg: Message) => void
   ) => void;

   onFunction: (
      type: ClientFunction,
      ctor: new () => Message,
      handler: (msg: Message) => Promise<Message>
   ) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClientConstructor<T = {}> = new (...args: any[]) => T & IClientHandler;

export function ImplementsClient<TBase extends ClientConstructor>(Base: TBase) {
   type Action<I> = (msg: I) => void;
   type Func<I, O> = (msg: I) => Promise<O>;

   return class extends Base {

      init(url: string, msg: Message.String): Promise<Message.String> {
         return this.initServer(url, msg);
      }

      // METHODS
      on(type: ClientMethod.Hello, handler: Action<Message.String>): void;
      on(type: ClientMethod.ClickFromClient, handler: Action<Message.Time>): void;

      // FUNCTIONS
      on(type: ClientFunction.GetVersion, handler: Func<Message.Boolean, Message.String>): void;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on(type: ClientMethod | ClientFunction, handler: any) {
         let ctorParameter: new () => Message;
         switch (type) {
            case ClientMethod.Hello:
               ctorParameter = Message.String;
               break;
            case ClientMethod.ClickFromClient:
               ctorParameter = Message.Time;
               break;

            case ClientFunction.GetVersion:
               ctorParameter = Message.Boolean;
               break;

            default:
               assertAllHandled(type);
               return;
         }
         if (isClientFunction(type)) {
            this.onFunction(type, ctorParameter, handler);
         } else {
            this.onMethod(type, ctorParameter, handler);
         }
      }

      // METHODS
      call(type: ServerMethod.Ping, msg: Message.Boolean): void;

      // FUNCTIONS
      call(type: ServerFunction.Init, msg: Message.String): Promise<Message.String>;
      call(type: ServerFunction.Click, msg: Message.Time): Promise<Message.Boolean>;

      call(type: ServerFunction | ServerMethod, msg: Message): Promise<Message> | void {
         if (isServerFunction(type)) {
            let ctorReturnType: new () => Message;
            switch (type) {
               case ServerFunction.Init:
                  ctorReturnType = Message.String;
                  break;
               case ServerFunction.Click:
                  ctorReturnType = Message.Boolean;
                  break;

               default:
                  assertAllHandled(type);
                  return;
            }
            return this.sendFunction(ctorReturnType, type, msg);
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}

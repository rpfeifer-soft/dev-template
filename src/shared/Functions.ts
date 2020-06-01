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

type StringParams =
   ServerFunction.Init |
   ClientMethod.Hello;

type BooleanParams =
   ServerMethod.Ping |
   ClientFunction.GetVersion;

type TimeParams =
   ServerFunction.Click |
   ClientMethod.ClickFromClient;

type Parameter<T> =
   T extends StringParams ? Message.String :
   T extends TimeParams ? Message.Time :
   T extends BooleanParams ? Message.Boolean :
   never;

function getParameter(type: ServerFunction | ServerMethod | ClientFunction | ClientMethod): new () => Message {
   switch (type) {
      case ServerFunction.Init:
      case ClientMethod.Hello:
         return Message.String;

      case ServerMethod.Ping:
      case ClientFunction.GetVersion:
         return Message.Boolean;

      case ServerFunction.Click:
      case ClientMethod.ClickFromClient:
         return Message.Time;

      default:
         return assertAllHandled(type);
   }
}

type StringReturns =
   ServerFunction.Init |
   ClientFunction.GetVersion;

type BooleanReturns =
   ServerFunction.Click;

type Returns<T> =
   T extends StringReturns ? Message.String :
   T extends BooleanReturns ? Message.Boolean :
   never;

function getReturns(type: ServerFunction | ClientFunction): new () => Message {
   switch (type) {

      case ServerFunction.Init:
      case ClientFunction.GetVersion:
         return Message.String;

      case ServerFunction.Click:
         return Message.Boolean;

      default:
         return assertAllHandled(type);
   }
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

   type OnArgs<T> = [T, Returns<T> extends never
      ? Action<Parameter<T>>
      : Func<Parameter<T>, Returns<T>>
   ];

   type BroadcastArgs<T> = [T, Parameter<T>];

   return function <TBase extends ServerConstructor>(Base: TBase) {
      return class extends Base {
         // METHODS
         on(...args: OnArgs<ServerMethod.Ping>): void;

         // FUNCTIONS
         on(...args: OnArgs<ServerFunction.Init>): void;
         on(...args: OnArgs<ServerFunction.Click>): void;

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         on(type: ServerMethod | ServerFunction, handler: any) {
            let ctorParameter = getParameter(type);
            if (isServerFunction(type)) {
               this.onFunction(type, ctorParameter, handler);
            } else {
               this.onMethod(type, ctorParameter, handler);
            }
         }

         broadcast(...args: BroadcastArgs<ClientMethod.Hello>): void;
         broadcast(...args: BroadcastArgs<ClientMethod.ClickFromClient>): void;

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

   type CallArgs<T> = [T, Parameter<T>];
   type ReturnArg<T> = Promise<Returns<T>>;

   return class extends Base {

      // METHODS
      call(...args: CallArgs<ClientMethod.Hello>): void;
      call(...args: CallArgs<ClientMethod.ClickFromClient>): void;

      // FUNCTIONS
      call(...args: CallArgs<ClientFunction.GetVersion>): ReturnArg<ClientFunction.GetVersion>;

      call(type: ClientFunction | ClientMethod, msg: Message): Promise<Message> | void {
         if (isClientFunction(type)) {
            let ctorReturnType = getReturns(type);
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

   type OnArgs<T> = [T, Returns<T> extends never
      ? Action<Parameter<T>>
      : Func<Parameter<T>, Returns<T>>
   ];

   type CallArgs<T> = [T, Parameter<T>];
   type ReturnArg<T> = Promise<Returns<T>>;

   return class extends Base {

      init(url: string, msg: Message.String): Promise<Message.String> {
         return this.initServer(url, msg);
      }

      // METHODS
      on(...args: OnArgs<ClientMethod.Hello>): void;
      on(...args: OnArgs<ClientMethod.ClickFromClient>): void;

      // FUNCTIONS
      on(...args: OnArgs<ClientFunction.GetVersion>): void;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on(type: ClientMethod | ClientFunction, handler: any) {
         let ctorParameter = getParameter(type);
         if (isClientFunction(type)) {
            this.onFunction(type, ctorParameter, handler);
         } else {
            this.onMethod(type, ctorParameter, handler);
         }
      }

      // METHODS
      call(...args: CallArgs<ServerMethod.Ping>): void;

      // FUNCTIONS
      call(...args: CallArgs<ServerFunction.Init>): ReturnArg<ServerFunction.Init>;
      call(...args: CallArgs<ServerFunction.Click>): ReturnArg<ServerFunction.Click>;

      call(type: ServerFunction | ServerMethod, msg: Message): Promise<Message> | void {
         if (isServerFunction(type)) {
            let ctorReturnType = getReturns(type);
            return this.sendFunction(ctorReturnType, type, msg);
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}

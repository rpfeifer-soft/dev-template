/* eslint-disable id-blacklist */
/** @format */

import Message, { Text, Time, Bool, Double } from './Message.js';
import MsgInit from './Messages/MsgInit.js';

type Unpack<T> =
   T extends (infer U)[] ? U : T;

function assertAllHandled(x: never): never {
   return x;
};

export enum ServerFunction {
   Init = 1,
   Click,
   Cool
}

export enum ServerMethod {
   Ping = 100
}

namespace ServerFunctions {
   declare function Init(msg: MsgInit): Text;
   declare function Click(msg: Time): Bool;
   declare function Cool(msg: Text): Double;
   declare function Ping(msg: Bool): void;

   export type Parameter<T> =
      T extends ServerFunction.Init ? Unpack<Parameters<typeof Init>> :
      T extends ServerFunction.Click ? Unpack<Parameters<typeof Click>> :
      T extends ServerFunction.Cool ? Unpack<Parameters<typeof Cool>> :
      T extends ServerMethod.Ping ? Unpack<Parameters<typeof Ping>> :
      never;

   export type Return<T> =
      T extends ServerFunction.Init ? ReturnType<typeof Init> :
      T extends ServerFunction.Click ? ReturnType<typeof Click> :
      T extends ServerFunction.Cool ? ReturnType<typeof Cool> :
      T extends ServerMethod.Ping ? ReturnType<typeof Ping> :
      never;

   export function getServerParameter(type: ServerFunction | ServerMethod): new () => Message {
      switch (type) {
         case ServerMethod.Ping:
            return Bool;

         case ServerFunction.Cool:
            return Text;

         case ServerFunction.Click:
            return Time;

         case ServerFunction.Init:
            return MsgInit;

         default:
            return assertAllHandled(type);
      }
   }

   export function getServerReturns(type: ServerFunction): new () => Message {
      switch (type) {

         case ServerFunction.Click:
            return Bool;

         case ServerFunction.Cool:
            return Double;

         case ServerFunction.Init:
            return Text;

         default:
            return assertAllHandled(type);
      }
   }
}

export enum ClientFunction {
   GetVersion = 1
}

export enum ClientMethod {
   Hello = 100,
   ClickFromClient
}

namespace ClientFunctions {
   declare function GetVersion(msg: Bool): Text;
   declare function Hello(msg: Text): void;
   declare function ClickFromClient(msg: Time): void;

   export type Parameter<T> =
      T extends ClientFunction.GetVersion ? Unpack<Parameters<typeof GetVersion>> :
      T extends ClientMethod.Hello ? Unpack<Parameters<typeof Hello>> :
      T extends ClientMethod.ClickFromClient ? Unpack<Parameters<typeof ClickFromClient>> :
      never;

   export type Return<T> =
      T extends ClientFunction.GetVersion ? ReturnType<typeof GetVersion> :
      T extends ClientMethod.Hello ? ReturnType<typeof Hello> :
      T extends ClientMethod.ClickFromClient ? ReturnType<typeof ClickFromClient> :
      never;

   export function getClientParameter(type: ClientFunction | ClientMethod): new () => Message {
      switch (type) {
         case ClientFunction.GetVersion:
            return Bool;

         case ClientMethod.Hello:
            return Text;

         case ClientMethod.ClickFromClient:
            return Time;

         default:
            return assertAllHandled(type);
      }
   }

   export function getClientReturns(type: ClientFunction): new () => Message {
      switch (type) {

         case ClientFunction.GetVersion:
            return Text;

         default:
            return assertAllHandled(type);
      }
   }
}

type Parameter<T> =
   ServerFunctions.Parameter<T> |
   ClientFunctions.Parameter<T>;

type Returns<T> =
   ServerFunctions.Return<T> |
   ClientFunctions.Return<T>;

export function isServerFunction(value: ServerMethod | ServerFunction): value is ServerFunction {
   // eslint-disable-next-line default-case
   switch (value) {
      case ServerMethod.Ping:
         return false;

      case ServerFunction.Init:
      case ServerFunction.Click:
      case ServerFunction.Cool:
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

   type OnArgs<T> = [T, Returns<T> extends void
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
         on(...args: OnArgs<ServerFunction.Cool>): void;

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         on(type: ServerMethod | ServerFunction, handler: any) {
            let ctorParameter = ServerFunctions.getServerParameter(type);
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
   type ReturnArg<T> = Returns<T> extends void ? void : Promise<Returns<T>>;

   return class extends Base {

      // METHODS
      call(...args: CallArgs<ClientMethod.Hello>): ReturnArg<ClientMethod.Hello>;
      call(...args: CallArgs<ClientMethod.ClickFromClient>): ReturnArg<ClientMethod.ClickFromClient>;

      // FUNCTIONS
      call(...args: CallArgs<ClientFunction.GetVersion>): ReturnArg<ClientFunction.GetVersion>;

      call(type: ClientFunction | ClientMethod, msg: Message): Promise<Message> | void {
         if (isClientFunction(type)) {
            let ctorReturnType = ClientFunctions.getClientReturns(type);
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

   type OnArgs<T> = [T, Returns<T> extends void
      ? Action<Parameter<T>>
      : Func<Parameter<T>, Returns<T>>
   ];

   type CallArgs<T> = [T, Parameter<T>];
   type ReturnArg<T> = Returns<T> extends void ? void : Promise<Returns<T>>;

   return class extends Base {

      init(url: string, msg: Parameter<ServerFunction.Init>): Promise<Returns<ServerFunction.Init>> {
         return this.initServer(url, msg);
      }

      // METHODS
      on(...args: OnArgs<ClientMethod.Hello>): void;
      on(...args: OnArgs<ClientMethod.ClickFromClient>): void;

      // FUNCTIONS
      on(...args: OnArgs<ClientFunction.GetVersion>): void;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on(type: ClientMethod | ClientFunction, handler: any) {
         let ctorParameter = ClientFunctions.getClientParameter(type);
         if (isClientFunction(type)) {
            this.onFunction(type, ctorParameter, handler);
         } else {
            this.onMethod(type, ctorParameter, handler);
         }
      }

      // METHODS
      call(...args: CallArgs<ServerMethod.Ping>): ReturnArg<ServerMethod.Ping>;

      // FUNCTIONS
      call(...args: CallArgs<ServerFunction.Init>): ReturnArg<ServerFunction.Init>;
      call(...args: CallArgs<ServerFunction.Click>): ReturnArg<ServerFunction.Click>;
      call(...args: CallArgs<ServerFunction.Cool>): ReturnArg<ServerFunction.Cool>;

      call(type: ServerFunction | ServerMethod, msg: Message): Promise<Message> | void {
         if (isServerFunction(type)) {
            let ctorReturnType = ServerFunctions.getServerReturns(type);
            return this.sendFunction(ctorReturnType, type, msg);
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}

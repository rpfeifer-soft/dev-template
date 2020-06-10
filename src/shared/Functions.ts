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
   Cool,
   Ping
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
      T extends ServerFunction.Ping ? Unpack<Parameters<typeof Ping>> :
      never;

   export type Return<T> =
      T extends ServerFunction.Init ? ReturnType<typeof Init> :
      T extends ServerFunction.Click ? ReturnType<typeof Click> :
      T extends ServerFunction.Cool ? ReturnType<typeof Cool> :
      T extends ServerFunction.Ping ? ReturnType<typeof Ping> :
      never;

   function getApi(type: ServerFunction): [new () => Message, (new () => Message) | undefined] {
      switch (type) {
         case ServerFunction.Init:
            return [MsgInit, Text];

         case ServerFunction.Click:
            return [Time, Bool];

         case ServerFunction.Cool:
            return [Text, Double];

         case ServerFunction.Ping:
            return [Bool, undefined];

         default:
            return assertAllHandled(type);
      }
   }

   export function getServerParameter(type: ServerFunction) {
      return getApi(type)[0];
   }

   export function getServerReturns(type: ServerFunction) {
      return getApi(type)[1];
   }
}

export enum ClientFunction {
   GetVersion = 1,
   Hello,
   ClickFromClient
}

namespace ClientFunctions {
   declare function GetVersion(msg: Bool): Text;
   declare function Hello(msg: Text): void;
   declare function ClickFromClient(msg: Time): void;

   export type Parameter<T> =
      T extends ClientFunction.GetVersion ? Unpack<Parameters<typeof GetVersion>> :
      T extends ClientFunction.Hello ? Unpack<Parameters<typeof Hello>> :
      T extends ClientFunction.ClickFromClient ? Unpack<Parameters<typeof ClickFromClient>> :
      never;

   export type Return<T> =
      T extends ClientFunction.GetVersion ? ReturnType<typeof GetVersion> :
      T extends ClientFunction.Hello ? ReturnType<typeof Hello> :
      T extends ClientFunction.ClickFromClient ? ReturnType<typeof ClickFromClient> :
      never;

   function getApi(type: ClientFunction): [new () => Message, (new () => Message) | undefined] {
      switch (type) {
         case ClientFunction.GetVersion:
            return [Bool, Text];

         case ClientFunction.Hello:
            return [Text, undefined];

         case ClientFunction.ClickFromClient:
            return [Time, undefined];

         default:
            return assertAllHandled(type);
      }
   }

   export function getClientParameter(type: ClientFunction) {
      return getApi(type)[0];
   }

   export function getClientReturns(type: ClientFunction) {
      return getApi(type)[1];
   }
}

type Parameter<T> =
   ServerFunctions.Parameter<T> |
   ClientFunctions.Parameter<T>;

type Returns<T> =
   ServerFunctions.Return<T> |
   ClientFunctions.Return<T>;

export interface IServerHandler<T> {
   onFunction: (
      type: ServerFunction,
      ctor: new () => Message,
      handler: (msg: Message, client: T) => Promise<Message> | void
   ) => void;

   broadcastMethod: (
      type: ClientFunction,
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
         on(...args: OnArgs<ServerFunction.Ping>): void;

         // FUNCTIONS
         on(...args: OnArgs<ServerFunction.Init>): void;
         on(...args: OnArgs<ServerFunction.Click>): void;
         on(...args: OnArgs<ServerFunction.Cool>): void;

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         on(type: ServerFunction, handler: any) {
            let ctorParameter = ServerFunctions.getServerParameter(type);
            this.onFunction(type, ctorParameter, handler);
         }

         broadcast(...args: BroadcastArgs<ClientFunction.Hello>): void;
         broadcast(...args: BroadcastArgs<ClientFunction.ClickFromClient>): void;

         broadcast(type: ClientFunction, msg: Message) {
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
type ServerClientConstructor<T = {}> = new (...args: any[]) =>
   T & ISenderHandler<ClientFunction, ClientFunction>;

export function ImplementsServerClient<TBase extends ServerClientConstructor>(Base: TBase) {

   type CallArgs<T> = [T, Parameter<T>];
   type ReturnArg<T> = Returns<T> extends void ? void : Promise<Returns<T>>;

   return class extends Base {

      // METHODS
      call(...args: CallArgs<ClientFunction.Hello>): ReturnArg<ClientFunction.Hello>;
      call(...args: CallArgs<ClientFunction.ClickFromClient>): ReturnArg<ClientFunction.ClickFromClient>;

      // FUNCTIONS
      call(...args: CallArgs<ClientFunction.GetVersion>): ReturnArg<ClientFunction.GetVersion>;

      call(type: ClientFunction, msg: Message): Promise<Message> | void {
         let ctorReturnType = ClientFunctions.getClientReturns(type);
         if (ctorReturnType) {
            return this.sendFunction(ctorReturnType, type, msg);
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}

export interface IClientHandler extends ISenderHandler<ServerFunction, ServerFunction> {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   initServer: (url: string, msgInit: Message) => any;

   onFunction: (
      type: ClientFunction,
      ctor: new () => Message,
      handler: (msg: Message) => Promise<Message> | void
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
      on(...args: OnArgs<ClientFunction.Hello>): void;
      on(...args: OnArgs<ClientFunction.ClickFromClient>): void;

      // FUNCTIONS
      on(...args: OnArgs<ClientFunction.GetVersion>): void;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on(type: ClientFunction, handler: any) {
         let ctorParameter = ClientFunctions.getClientParameter(type);
         this.onFunction(type, ctorParameter, handler);
      }

      // METHODS
      call(...args: CallArgs<ServerFunction.Ping>): ReturnArg<ServerFunction.Ping>;

      // FUNCTIONS
      call(...args: CallArgs<ServerFunction.Init>): ReturnArg<ServerFunction.Init>;
      call(...args: CallArgs<ServerFunction.Click>): ReturnArg<ServerFunction.Click>;
      call(...args: CallArgs<ServerFunction.Cool>): ReturnArg<ServerFunction.Cool>;

      call(type: ServerFunction, msg: Message): Promise<Message> | void {
         let ctorReturnType = ServerFunctions.getServerReturns(type);
         if (ctorReturnType) {
            return this.sendFunction(ctorReturnType, type, msg);
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}

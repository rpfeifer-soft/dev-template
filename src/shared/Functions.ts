/* eslint-disable id-blacklist */
/** @format */

import Message, { Text, Time, Bool, Double } from './Message.js';
import MsgInit from './Messages/MsgInit.js';

// Helper types
type Unpack<T> =
   T extends (infer U)[] ? U : T;

type First<T> =
   T extends [(infer U), (infer V)] ? U : T;

type Second<T> =
   T extends [(infer U), (infer V)] ? V : T;

type Analyze<T extends ((msg: Message) => Message | void)>
   = [Unpack<Parameters<T>>, ReturnType<T>];

// Api map
interface IApiDefs {
   [key: number]: [new () => Message, (new () => Message) | undefined];
};

// Server functions
export enum ServerFunction {
   Init = 1,
   Click,
   Cool,
   Ping
}

export namespace ServerFunctions {
   const apiDefs: IApiDefs = {};

   // Declare the functions
   declare function Init(msg: MsgInit): Text;
   declare function Click(msg: Time): Bool;
   declare function Cool(msg: Text): Double;
   declare function Ping(msg: Bool): void;

   // Declare the api
   apiDefs[ServerFunction.Init] = [MsgInit, Text];
   apiDefs[ServerFunction.Click] = [Time, Bool];
   apiDefs[ServerFunction.Cool] = [Text, Double];
   apiDefs[ServerFunction.Ping] = [Bool, undefined];

   // Declare the types
   type Packing<T> =
      T extends ServerFunction.Init ? Analyze<typeof Init> :
      T extends ServerFunction.Click ? Analyze<typeof Click> :
      T extends ServerFunction.Cool ? Analyze<typeof Cool> :
      T extends ServerFunction.Ping ? Analyze<typeof Ping> :
      never;

   export type Parameter<T> = First<Packing<T>>;
   export type Returns<T> = Second<Packing<T>>;

   export function getApi(type: ServerFunction): [new () => Message, (new () => Message) | undefined] {
      return apiDefs[type];
   }

   export function getParameter(type: ServerFunction) {
      return getApi(type)[0];
   }

   export function getReturns(type: ServerFunction) {
      return getApi(type)[1];
   }
}

// Client functions
export enum ClientFunction {
   GetVersion = 1,
   Hello,
   ClickFromClient
}

export namespace ClientFunctions {
   const apiDefs: IApiDefs = {};

   // Declare the functions
   declare function GetVersion(msg: Bool): Text;
   declare function Hello(msg: Text): void;
   declare function ClickFromClient(msg: Time): void;

   // Declare the api
   apiDefs[ClientFunction.GetVersion] = [Bool, Text];
   apiDefs[ClientFunction.Hello] = [Text, undefined];
   apiDefs[ClientFunction.ClickFromClient] = [Time, undefined];

   // Declare the types
   type Packing<T> =
      T extends ClientFunction.GetVersion ? Analyze<typeof GetVersion> :
      T extends ClientFunction.Hello ? Analyze<typeof Hello> :
      T extends ClientFunction.ClickFromClient ? Analyze<typeof ClickFromClient> :
      never;

   export type Parameter<T> = First<Packing<T>>;
   export type Returns<T> = Second<Packing<T>>;

   export function getApi(type: ClientFunction): [new () => Message, (new () => Message) | undefined] {
      return apiDefs[type];
   }

   export function getParameter(type: ClientFunction) {
      return getApi(type)[0];
   }

   export function getReturns(type: ClientFunction) {
      return getApi(type)[1];
   }
}

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

   type OnArgs<T> = [T, ServerFunctions.Returns<T> extends void
      ? Action<ServerFunctions.Parameter<T>>
      : Func<ServerFunctions.Parameter<T>, ServerFunctions.Returns<T>>
   ];

   type BroadcastArgs<T> = ClientFunctions.Returns<T> extends void
      ? [T, ClientFunctions.Parameter<T>] : never;

   return function <TBase extends ServerConstructor>(Base: TBase) {
      return class extends Base {
         // FUNCTIONS
         on(...args: OnArgs<ServerFunction.Init>): void;
         on(...args: OnArgs<ServerFunction.Click>): void;
         on(...args: OnArgs<ServerFunction.Cool>): void;
         on(...args: OnArgs<ServerFunction.Ping>): void;

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         on(type: ServerFunction, handler: any) {
            let ctorParameter = ServerFunctions.getParameter(type);
            this.onFunction(type, ctorParameter, handler);
         }

         broadcast(...args: BroadcastArgs<ClientFunction.GetVersion>): void;
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

   type CallArgs<T> = [T, ClientFunctions.Parameter<T>];
   type ReturnArg<T> = ClientFunctions.Returns<T> extends void
      ? void : Promise<ClientFunctions.Returns<T>>;

   return class extends Base {
      // FUNCTIONS
      call(...args: CallArgs<ClientFunction.GetVersion>): ReturnArg<ClientFunction.GetVersion>;
      call(...args: CallArgs<ClientFunction.Hello>): ReturnArg<ClientFunction.Hello>;
      call(...args: CallArgs<ClientFunction.ClickFromClient>): ReturnArg<ClientFunction.ClickFromClient>;

      call(type: ClientFunction, msg: Message): Promise<Message> | void {
         let ctorReturnType = ClientFunctions.getReturns(type);
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

   type OnArgs<T> = [T, ClientFunctions.Returns<T> extends void
      ? Action<ClientFunctions.Parameter<T>>
      : Func<ClientFunctions.Parameter<T>, ClientFunctions.Returns<T>>
   ];

   type CallArgs<T> = [T, ServerFunctions.Parameter<T>];
   type ReturnArg<T> = ServerFunctions.Returns<T> extends void
      ? void : Promise<ServerFunctions.Returns<T>>;

   return class extends Base {

      init(
         url: string,
         msg: ServerFunctions.Parameter<ServerFunction.Init>
      ): Promise<ServerFunctions.Returns<ServerFunction.Init>> {
         return this.initServer(url, msg);
      }

      // FUNCTIONS
      on(...args: OnArgs<ClientFunction.GetVersion>): void;
      on(...args: OnArgs<ClientFunction.Hello>): void;
      on(...args: OnArgs<ClientFunction.ClickFromClient>): void;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on(type: ClientFunction, handler: any) {
         let ctorParameter = ClientFunctions.getParameter(type);
         this.onFunction(type, ctorParameter, handler);
      }

      // FUNCTIONS
      call(...args: CallArgs<ServerFunction.Init>): ReturnArg<ServerFunction.Init>;
      call(...args: CallArgs<ServerFunction.Click>): ReturnArg<ServerFunction.Click>;
      call(...args: CallArgs<ServerFunction.Cool>): ReturnArg<ServerFunction.Cool>;
      call(...args: CallArgs<ServerFunction.Ping>): ReturnArg<ServerFunction.Ping>;

      call(type: ServerFunction, msg: Message): Promise<Message> | void {
         let ctorReturnType = ServerFunctions.getReturns(type);
         if (ctorReturnType) {
            return this.sendFunction(ctorReturnType, type, msg);
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}

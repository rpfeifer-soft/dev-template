/* eslint-disable id-blacklist */
/** @format */

import Message, { fString, fDate, fBool, fNumber, IMessageFactory } from './Message.js';
import Init, { fInit } from './Messages/Init.js';

// Helper types
type Unpack<T> =
   T extends (infer U)[] ? U : T;

type First<T> =
   T extends [(infer U), (infer V)] ? U : T;

type Second<T> =
   T extends [(infer U), (infer V)] ? V : T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Analyze<T extends ((msg: any) => any | void)>
   = [Unpack<Parameters<T>>, ReturnType<T>];

// Api map
interface IApiDefs {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   [key: number]: [IMessageFactory<any>, IMessageFactory<any> | undefined];
};

// Server functions
export enum ServerFunction {
   // eslint-disable-next-line no-shadow
   Init = 1,
   Click,
   Cool,
   Ping
}

export namespace ServerFunctions {
   const apiDefs: IApiDefs = {};

   // Declare the functions
   declare function dInit(msg: Init): string;
   declare function dClick(msg: Date): boolean;
   declare function dCool(msg: string): number;
   declare function dPing(msg: boolean): void;

   // Declare the api
   apiDefs[ServerFunction.Init] = [fInit, fString];
   apiDefs[ServerFunction.Click] = [fDate, fBool];
   apiDefs[ServerFunction.Cool] = [fString, fNumber];
   apiDefs[ServerFunction.Ping] = [fBool, undefined];

   // Declare the types
   type Packing<T> =
      T extends ServerFunction.Init ? Analyze<typeof dInit> :
      T extends ServerFunction.Click ? Analyze<typeof dClick> :
      T extends ServerFunction.Cool ? Analyze<typeof dCool> :
      T extends ServerFunction.Ping ? Analyze<typeof dPing> :
      never;

   export type Parameter<T> = First<Packing<T>>;
   export type Returns<T> = Second<Packing<T>>;

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   export function getApi(type: ServerFunction): [IMessageFactory<any>, IMessageFactory<any> | undefined] {
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
   declare function dGetVersion(msg: boolean): string;
   declare function dHello(msg: string): void;
   declare function dClickFromClient(msg: Date): void;

   // Declare the api
   apiDefs[ClientFunction.GetVersion] = [fBool, fString];
   apiDefs[ClientFunction.Hello] = [fString, undefined];
   apiDefs[ClientFunction.ClickFromClient] = [fDate, undefined];

   // Declare the types
   type Packing<T> =
      T extends ClientFunction.GetVersion ? Analyze<typeof dGetVersion> :
      T extends ClientFunction.Hello ? Analyze<typeof dHello> :
      T extends ClientFunction.ClickFromClient ? Analyze<typeof dClickFromClient> :
      never;

   export type Parameter<T> = First<Packing<T>>;
   export type Returns<T> = Second<Packing<T>>;

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   export function getApi(type: ClientFunction): [IMessageFactory<any>, IMessageFactory<any> | undefined] {
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
      ctor: () => Message,
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

         on(type: ServerFunction, handler: Func<unknown, unknown> | Action<unknown>) {
            let factoryParam = ServerFunctions.getParameter(type);
            let factoryReturn = ServerFunctions.getReturns(type);

            let ctorParameter = () => factoryParam.pack();

            this.onFunction(type, ctorParameter, (data: Message, client: T) => {
               let promise = handler(factoryParam.unpack(data), client);
               if (!promise || !factoryReturn) {
                  return;
               }
               let pack = factoryReturn.pack;
               return promise.then(msg => pack(msg));
            });
         }

         broadcast(...args: BroadcastArgs<ClientFunction.GetVersion>): void;
         broadcast(...args: BroadcastArgs<ClientFunction.Hello>): void;
         broadcast(...args: BroadcastArgs<ClientFunction.ClickFromClient>): void;

         broadcast(type: ClientFunction, data: unknown) {
            let factoryParam = ClientFunctions.getParameter(type);
            let msg = factoryParam.pack(data);
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
      ctor: () => Message,
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

      call(type: ClientFunction, data: unknown): Promise<unknown> | void {
         let factoryParam = ClientFunctions.getParameter(type);
         let factoryReturn = ClientFunctions.getReturns(type);

         let msg = factoryParam.pack(data);

         if (factoryReturn) {
            let pack = factoryReturn.pack;
            let unpack = factoryReturn.unpack;
            let ctorReturnType = () => pack();
            return this.sendFunction(ctorReturnType, type, msg)
               .then(resultMsg => unpack(resultMsg));
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}

type InitReturn = ServerFunctions.Returns<ServerFunction.Init> extends undefined
   ? void
   : Promise<Message>;

export interface IClientHandler extends ISenderHandler<ServerFunction, ServerFunction> {

   initServer: (url: string, ctor: () => Message, msgInit: Message) => InitReturn;

   onFunction: (
      type: ClientFunction,
      ctor: () => Message,
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

      init(url: string, data: ServerFunctions.Parameter<ServerFunction.Init>): ReturnArg<ServerFunction.Init>;
      init(url: string, data: unknown) {
         let factoryParam = ServerFunctions.getParameter(ServerFunction.Init);
         let factoryReturn = ServerFunctions.getReturns(ServerFunction.Init);

         let msg = factoryParam.pack(data);

         if (!factoryReturn) {
            return;
         }
         let pack = factoryReturn.pack;
         let ctor = () => pack();

         return this.initServer(url, ctor, msg)
            .then(resultMsg => factoryReturn ? factoryReturn.unpack(resultMsg) : resultMsg);
      }

      // FUNCTIONS
      on(...args: OnArgs<ClientFunction.GetVersion>): void;
      on(...args: OnArgs<ClientFunction.Hello>): void;
      on(...args: OnArgs<ClientFunction.ClickFromClient>): void;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on(type: ClientFunction, handler: Func<unknown, unknown> | Action<unknown>) {
         let factoryParam = ClientFunctions.getParameter(type);
         let factoryReturn = ClientFunctions.getReturns(type);

         let ctorParameter = () => factoryParam.pack();

         this.onFunction(type, ctorParameter, (data: Message) => {
            let promise = handler(factoryParam.unpack(data));
            if (!promise || !factoryReturn) {
               return;
            }
            let pack = factoryReturn.pack;
            return promise.then(msg => pack(msg));
         });
      }

      // FUNCTIONS
      call(...args: CallArgs<ServerFunction.Init>): ReturnArg<ServerFunction.Init>;
      call(...args: CallArgs<ServerFunction.Click>): ReturnArg<ServerFunction.Click>;
      call(...args: CallArgs<ServerFunction.Cool>): ReturnArg<ServerFunction.Cool>;
      call(...args: CallArgs<ServerFunction.Ping>): ReturnArg<ServerFunction.Ping>;

      call(type: ServerFunction, data: unknown): Promise<unknown> | void {
         let factoryParam = ServerFunctions.getParameter(type);
         let factoryReturn = ServerFunctions.getReturns(type);

         let msg = factoryParam.pack(data);

         if (factoryReturn) {
            let pack = factoryReturn.pack;
            let unpack = factoryReturn.unpack;
            let ctorReturnType = () => pack();
            return this.sendFunction(ctorReturnType, type, msg)
               .then(resultMsg => unpack(resultMsg));
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}

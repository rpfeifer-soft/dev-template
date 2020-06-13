/** @format */

import Message from './Msg/Message.js';
import fVoid from './Msg/Void.js';
import fBool from '../shared/Msg/Bool.js';
import fString from '../shared/Msg/String.js';
import fNumber from '../shared/Msg/Number.js';
import fDate from '../shared/Msg/Date.js';
import ConnectInfo, { fConnectInfo } from './Data/ConnectInfo.js';
import ClientInfo, { fClientInfo } from './Data/ClientInfo.js';

// Helper types
type Unpack<T> =
   T extends (infer U)[] ? U : T;

type First<T> =
   T extends [(infer U), (infer V)] ? U : T;

type Second<T> =
   T extends [(infer U), (infer V)] ? V : T;

type Analyze<T extends ((msg: unknown) => unknown | void)>
   = [Unpack<Parameters<T>>, ReturnType<T>];

type ApiTuple = [
   Message.IMessageFactory<unknown>,
   Message.IMessageFactory<unknown> | undefined
];

// Api map
interface IApiDefs {
   [key: number]: ApiTuple;
};

// Server functions
export enum ServerFunction {
   Connect = 1,
   GetClientInfos,
   Cool,
   Ping
}

export namespace ServerFunctions {
   const apiDefs: IApiDefs = {};

   // Declare the functions
   declare function dConnect(msg: ConnectInfo): ClientInfo;
   declare function dGetClientInfos(): ClientInfo[];
   declare function dCool(msg: string): number;
   declare function dPing(msg: boolean): void;

   // Declare the api
   apiDefs[ServerFunction.Connect] = [fConnectInfo, fClientInfo];
   apiDefs[ServerFunction.GetClientInfos] = [fVoid, fClientInfo.array];
   apiDefs[ServerFunction.Cool] = [fString, fNumber];
   apiDefs[ServerFunction.Ping] = [fBool, undefined];

   // Declare the types
   type Packing<T> =
      T extends ServerFunction.Connect ? Analyze<typeof dConnect> :
      T extends ServerFunction.GetClientInfos ? Analyze<typeof dGetClientInfos> :
      T extends ServerFunction.Cool ? Analyze<typeof dCool> :
      T extends ServerFunction.Ping ? Analyze<typeof dPing> :
      never;

   export type Parameter<T> = First<Packing<T>>;
   export type Returns<T> = Second<Packing<T>>;

   export function getApi(type: ServerFunction): ApiTuple {
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
   ClientsChanged,
   ClickFromClient
}

export namespace ClientFunctions {
   const apiDefs: IApiDefs = {};

   // Declare the functions
   declare function dGetVersion(msg: boolean): string;
   declare function dClientsChanged(): void;
   declare function dClickFromClient(msg: Date): void;

   // Declare the api
   apiDefs[ClientFunction.GetVersion] = [fBool, fString];
   apiDefs[ClientFunction.ClientsChanged] = [fVoid, undefined];
   apiDefs[ClientFunction.ClickFromClient] = [fDate, undefined];

   // Declare the types
   type Packing<T> =
      T extends ClientFunction.GetVersion ? Analyze<typeof dGetVersion> :
      T extends ClientFunction.ClientsChanged ? Analyze<typeof dClientsChanged> :
      T extends ClientFunction.ClickFromClient ? Analyze<typeof dClickFromClient> :
      never;

   export type Parameter<T> = First<Packing<T>>;
   export type Returns<T> = Second<Packing<T>>;

   export function getApi(type: ClientFunction): ApiTuple {
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
      exceptId: number,
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
      ? (ClientFunctions.Parameter<T> extends void
         ? [number, T]
         : [number, T, ClientFunctions.Parameter<T>])
      : never;

   return function <TBase extends ServerConstructor>(Base: TBase) {
      return class extends Base {
         // FUNCTIONS
         on(...args: OnArgs<ServerFunction.Connect>): void;
         on(...args: OnArgs<ServerFunction.GetClientInfos>): void;
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
         broadcast(...args: BroadcastArgs<ClientFunction.ClientsChanged>): void;
         broadcast(...args: BroadcastArgs<ClientFunction.ClickFromClient>): void;

         broadcast(exceptId: number, type: ClientFunction, data?: unknown) {
            let factoryParam = ClientFunctions.getParameter(type);
            let msg = factoryParam.pack(data);
            this.broadcastMethod(exceptId, type, msg);
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

   type CallArgs<T> = ClientFunctions.Parameter<T> extends void
      ? [T] : [T, ClientFunctions.Parameter<T>];
   type ReturnArg<T> = ClientFunctions.Returns<T> extends void
      ? void : Promise<ClientFunctions.Returns<T>>;

   return class extends Base {
      // FUNCTIONS
      call(...args: CallArgs<ClientFunction.GetVersion>): ReturnArg<ClientFunction.GetVersion>;
      call(...args: CallArgs<ClientFunction.ClientsChanged>): ReturnArg<ClientFunction.ClientsChanged>;
      call(...args: CallArgs<ClientFunction.ClickFromClient>): ReturnArg<ClientFunction.ClickFromClient>;

      call(type: ClientFunction, data?: unknown): Promise<unknown> | void {
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

type InitReturn = ServerFunctions.Returns<ServerFunction.Connect> extends undefined
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

   type CallArgs<T> = ServerFunctions.Parameter<T> extends void
      ? [T] : [T, ServerFunctions.Parameter<T>];
   type ReturnArg<T> = ServerFunctions.Returns<T> extends void
      ? void : Promise<ServerFunctions.Returns<T>>;

   return class extends Base {

      init(url: string, data: ServerFunctions.Parameter<ServerFunction.Connect>): ReturnArg<ServerFunction.Connect>;
      init(url: string, data: unknown) {
         let factoryParam = ServerFunctions.getParameter(ServerFunction.Connect);
         let factoryReturn = ServerFunctions.getReturns(ServerFunction.Connect);

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
      on(...args: OnArgs<ClientFunction.ClientsChanged>): void;
      on(...args: OnArgs<ClientFunction.ClickFromClient>): void;

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
      call(...args: CallArgs<ServerFunction.Connect>): ReturnArg<ServerFunction.Connect>;
      call(...args: CallArgs<ServerFunction.GetClientInfos>): ReturnArg<ServerFunction.GetClientInfos>;
      call(...args: CallArgs<ServerFunction.Cool>): ReturnArg<ServerFunction.Cool>;
      call(...args: CallArgs<ServerFunction.Ping>): ReturnArg<ServerFunction.Ping>;

      call(type: ServerFunction, data?: unknown): Promise<unknown> | void {
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

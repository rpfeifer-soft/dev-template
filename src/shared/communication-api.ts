/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-namespace */
/** @format */

import { Message, IMessageFactory } from './serialize/Message.js';
import { ConnectInfo, fConnectInfo } from './data/ConnectInfo.js';
import { ClientInfo, fClientInfo } from './data/ClientInfo.js';
import { fVoid, fBool, fNumber, fString } from './serialize/serializers.js';

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
   IMessageFactory<unknown>,
   IMessageFactory<unknown> | undefined
];

// Api map
interface IApiDefs {
   [key: number]: ApiTuple;
}

// Server functions
export enum ServerFunction {
   Connect = 1,
   GetClientInfos,
   SetUser,
   SendAuthCode,
   Login,
   Logoff
}

export namespace ServerFunctions {
   const apiDefs: IApiDefs = {};

   // Declare the functions
   declare function dConnect(msg: ConnectInfo): ClientInfo;
   declare function dGetClientInfos(): ClientInfo[];
   declare function dSetUser(userName: string): ClientInfo;
   declare function dSendAuthCode(): boolean;
   declare function dLogin(authCode: string): ClientInfo;
   declare function dLogoff(): ClientInfo;

   // Declare the api
   apiDefs[ServerFunction.Connect] = [fConnectInfo, fClientInfo];
   apiDefs[ServerFunction.GetClientInfos] = [fVoid, fClientInfo.array];
   apiDefs[ServerFunction.SetUser] = [fString, fClientInfo];
   apiDefs[ServerFunction.SendAuthCode] = [fString, fBool];
   apiDefs[ServerFunction.Login] = [fString, fClientInfo];
   apiDefs[ServerFunction.Logoff] = [fVoid, fClientInfo];

   // Declare the types
   type Packing<T> =
      T extends ServerFunction.Connect ? Analyze<typeof dConnect> :
      T extends ServerFunction.GetClientInfos ? Analyze<typeof dGetClientInfos> :
      T extends ServerFunction.SetUser ? Analyze<typeof dSetUser> :
      T extends ServerFunction.SendAuthCode ? Analyze<typeof dSendAuthCode> :
      T extends ServerFunction.Login ? Analyze<typeof dLogin> :
      T extends ServerFunction.Logoff ? Analyze<typeof dLogoff> :
      never;

   export type Parameter<T> = First<Packing<T>>;
   export type Returns<T> = Second<Packing<T>>;

   export function getApi(type: ServerFunction): ApiTuple {
      return apiDefs[type];
   }

   export function getParameter(type: ServerFunction): IMessageFactory<unknown> {
      return getApi(type)[0];
   }

   export function getReturns(type: ServerFunction): IMessageFactory<unknown> | undefined {
      return getApi(type)[1];
   }
}

// Client functions
export enum ClientFunction {
   GetVersion = 1,
   ClientChanged,
   ClientsRemoved
}

export namespace ClientFunctions {
   const apiDefs: IApiDefs = {};

   // Declare the functions
   declare function dGetVersion(): string;
   declare function dClientsChanged(info: ClientInfo): void;
   declare function dClientsRemoved(ids: number[]): void;

   // Declare the api
   apiDefs[ClientFunction.GetVersion] = [fVoid, fString];
   apiDefs[ClientFunction.ClientChanged] = [fClientInfo, undefined];
   apiDefs[ClientFunction.ClientsRemoved] = [fNumber.array, undefined];

   // Declare the types
   type Packing<T> =
      T extends ClientFunction.GetVersion ? Analyze<typeof dGetVersion> :
      T extends ClientFunction.ClientChanged ? Analyze<typeof dClientsChanged> :
      T extends ClientFunction.ClientsRemoved ? Analyze<typeof dClientsRemoved> :
      never;

   export type Parameter<T> = First<Packing<T>>;
   export type Returns<T> = Second<Packing<T>>;

   export function getApi(type: ClientFunction): ApiTuple {
      return apiDefs[type];
   }

   export function getParameter(type: ClientFunction): IMessageFactory<unknown> {
      return getApi(type)[0];
   }

   export function getReturns(type: ClientFunction): IMessageFactory<unknown> | undefined {
      return getApi(type)[1];
   }
}

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
export function implementsServer<T, TBase extends ServerConstructor<T>>(Base: TBase) {
   type Action<I> = (msg: I, client: T) => void;
   type Func<I, O> = (msg: I, client: T) => Promise<O>;

   type OnArgs<T> = [T, ServerFunctions.Returns<T> extends void
      ? Action<ServerFunctions.Parameter<T>>
      : Func<ServerFunctions.Parameter<T>, ServerFunctions.Returns<T>>
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
         const factoryParam = ServerFunctions.getParameter(type);
         const factoryReturn = ServerFunctions.getReturns(type);

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

export interface ISenderHandler<TMethod, TFunction> {
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
type ServerClientConstructor = new (...args: any[]) =>
   ISenderHandler<ClientFunction, ClientFunction>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function implementsServerClient<TBase extends ServerClientConstructor>(Base: TBase) {

   type CallArgs<T> = ClientFunctions.Parameter<T> extends void
      ? [T] : [T, ClientFunctions.Parameter<T>];
   type ReturnArg<T> = ClientFunctions.Returns<T> extends void
      ? void : Promise<ClientFunctions.Returns<T>>;

   return class extends Base {
      // FUNCTIONS
      call(...args: CallArgs<ClientFunction.GetVersion>): ReturnArg<ClientFunction.GetVersion>;
      call(...args: CallArgs<ClientFunction.ClientChanged>): ReturnArg<ClientFunction.ClientChanged>;
      call(...args: CallArgs<ClientFunction.ClientsRemoved>): ReturnArg<ClientFunction.ClientsRemoved>;

      call(type: ClientFunction, data?: unknown): Promise<unknown> | void {
         const factoryParam = ClientFunctions.getParameter(type);
         const factoryReturn = ClientFunctions.getReturns(type);

         const msg = factoryParam.pack(data);

         if (factoryReturn) {
            const pack = factoryReturn.pack;
            const unpack = factoryReturn.unpack;
            const ctorReturnType = () => pack();
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
type ClientConstructor = new (...args: any[]) => IClientHandler;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function implementsClient<TBase extends ClientConstructor>(Base: TBase) {
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
      init(url: string, data: unknown): unknown {
         const factoryParam = ServerFunctions.getParameter(ServerFunction.Connect);
         const factoryReturn = ServerFunctions.getReturns(ServerFunction.Connect);

         const msg = factoryParam.pack(data);

         if (!factoryReturn) {
            return;
         }
         const pack = factoryReturn.pack;
         const ctor = () => pack();

         return this.initServer(url, ctor, msg)
            .then(resultMsg => factoryReturn ? factoryReturn.unpack(resultMsg) : resultMsg);
      }

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

      // FUNCTIONS
      call(...args: CallArgs<ServerFunction.Connect>): ReturnArg<ServerFunction.Connect>;
      call(...args: CallArgs<ServerFunction.GetClientInfos>): ReturnArg<ServerFunction.GetClientInfos>;
      call(...args: CallArgs<ServerFunction.SetUser>): ReturnArg<ServerFunction.SetUser>;
      call(...args: CallArgs<ServerFunction.SendAuthCode>): ReturnArg<ServerFunction.SendAuthCode>;
      call(...args: CallArgs<ServerFunction.Login>): ReturnArg<ServerFunction.Login>;
      call(...args: CallArgs<ServerFunction.Logoff>): ReturnArg<ServerFunction.Logoff>;

      call(type: ServerFunction, data?: unknown): Promise<unknown> | void {
         const factoryParam = ServerFunctions.getParameter(type);
         const factoryReturn = ServerFunctions.getReturns(type);

         const msg = factoryParam.pack(data);

         if (factoryReturn) {
            const pack = factoryReturn.pack;
            const unpack = factoryReturn.unpack;
            const ctorReturnType = () => pack();
            return this.sendFunction(ctorReturnType, type, msg)
               .then(resultMsg => unpack(resultMsg));
         } else {
            return this.pushMethod(type, msg);
         }
      }
   };
}

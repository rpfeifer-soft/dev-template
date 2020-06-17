/** @format */

import { IMessageFactory } from './serialize/Message.js';
import { ConnectInfo, fConnectInfo } from './data/ConnectInfo.js';
import { ClientInfo, fClientInfo } from './data/ClientInfo.js';
import { fVoid, fString, fBool } from './serialize/serializers.js';

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

function getApi(type: ServerFunction): ApiTuple {
   return apiDefs[type];
}

export function getParameter(type: ServerFunction): IMessageFactory<unknown> {
   return getApi(type)[0];
}

export function getReturns(type: ServerFunction): IMessageFactory<unknown> | undefined {
   return getApi(type)[1];
}

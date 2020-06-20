/** @format */

import { IMessageFactory } from './serialize/Message.js';
import { ClientInfo, fClientInfo } from './data/data.js';
import { fVoid, fNumber, fString } from './serialize/serializers.js';

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

// Client functions
export enum ClientFunction {
   GetVersion = 1,
   ClientChanged,
   ClientsRemoved
}

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

function getApi(type: ClientFunction): ApiTuple {
   return apiDefs[type];
}

export function getParameter(type: ClientFunction): IMessageFactory<unknown> {
   return getApi(type)[0];
}

export function getReturns(type: ClientFunction): IMessageFactory<unknown> | undefined {
   return getApi(type)[1];
}

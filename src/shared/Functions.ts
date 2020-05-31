/** @format */

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

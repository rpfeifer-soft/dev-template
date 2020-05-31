/** @format */

export enum ClientMethod {
   Hello = 100,
   ClickFromClient
}

export enum ClientFunction {
   GetVersion = 1
}

function assertAllHandled(x: never): never {
   return x;
};

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
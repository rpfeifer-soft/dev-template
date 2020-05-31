/** @format */

export enum ServerMethod {
   Ping = 100
}

export enum ServerFunction {
   Init = 1,
   Click
}

function assertAllHandled(x: never): never {
   return x;
};

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
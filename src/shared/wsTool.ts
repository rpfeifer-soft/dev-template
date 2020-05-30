/** @format */

import ServerFunc from './ServerFunc.js';
import ClientFunc from './ClientFunc.js';

interface IRequestError {
   requestId: number;
   error: string;
}

interface IRequestResult {
   requestId: number;
   result: string;
}

type IRequest = IRequestError | IRequestResult;

interface IClientMessage {
   type: ServerFunc;
   data: string;
   requestId?: number;
}

interface IServerMessage {
   type: ClientFunc;
   data: string;
   requestId?: number;
}

// Low level support to allow binary transport
function parseData<T>(data: string | ArrayBuffer): T {
   if (typeof (data) !== 'string') {
      throw new Error('Unsupport ws-socket data format!');
   }

   return JSON.parse(data) as T;
}

function prepareData<T>(json: T): string | ArrayBuffer {
   return JSON.stringify(json);
}

function parseMessage<T extends IClientMessage | IServerMessage>(
   data: string | ArrayBuffer
): T | false {
   let json = parseData<T>(data);
   if ('data' in json) {
      return json;
   }
   return false;
}

namespace WSTool {

   export function parseRequest(data: string | ArrayBuffer): IRequest | false {
      let json = parseData<IRequest>(data);
      if ('error' in json) {
         return json;
      }

      if ('result' in json) {
         return json;
      }
      return false;
   }

   export function prepareError(requestId: number, error: string) {
      let json: IRequestError = {
         requestId,
         error
      };
      return prepareData(json);
   }

   export function prepareResult(requestId: number, result: string) {
      let json: IRequestResult = {
         requestId,
         result
      };
      return prepareData(json);
   }

   export class Client {
      static parse(data: string | ArrayBuffer) {
         return parseMessage<IClientMessage>(data);
      }

      static prepare(type: ServerFunc, data: string, requestId: number | false) {
         let json: IClientMessage = {
            type,
            requestId: requestId ? requestId : undefined,
            data
         };
         return prepareData(json);
      }
   }

   export class Server {
      static parse(data: string | ArrayBuffer) {
         return parseMessage<IServerMessage>(data);
      }

      static prepare(type: ClientFunc, data: string, requestId: number | false) {
         let json: IServerMessage = {
            type,
            requestId: requestId ? requestId : undefined,
            data
         };
         return prepareData(json);
      }
   }
}
export default WSTool;
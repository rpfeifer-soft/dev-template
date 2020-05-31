/** @format */

import ServerFunc from './ServerFunc.js';
import ClientFunc from './ClientFunc.js';

interface IRequestError {
   requestId: number;
   error: string;
}

interface IRequestResult {
   requestId: number;
   result: string | ArrayBuffer;
}

type IRequest = IRequestError | IRequestResult;

interface IClientMessage {
   type: ServerFunc;
   data: string | ArrayBuffer;
   requestId?: number;
}

interface IServerMessage {
   type: ClientFunc;
   data: string | ArrayBuffer;
   requestId?: number;
}

enum PacketType {
   Result = 1,
   Message = 2
}

// Low level support to allow binary transport

// PacketType.Result
// 1 | RequestId | data
// 2 | RequestId | type | data
function parseData<T>(data: string | ArrayBuffer): T {
   if (typeof (data) === 'string') {
      return JSON.parse(data) as T;
   }
   // Arraybuffer
   let view = new DataView(data);
   let packet = view.getUint8(0) as PacketType;
   let requestId = view.getUint32(1);
   let content = data.slice(packet === PacketType.Result ? 5 : 9);

   if (packet === PacketType.Message) {
      // IClientMessage | IServerMessage
      let type = view.getUint32(5);
      return {
         type: type,
         data: content,
         requestId: requestId || undefined
      } as IClientMessage as unknown as T;
   }
   // IRequestResult
   return {
      requestId: requestId,
      result: data
   } as IRequestResult as unknown as T;
}

// PacketType.Result
// 1 | RequestId | data
// 2 | RequestId | type | data
function createPacket(
   packet: PacketType,
   data: ArrayBuffer,
   requestId?: number,
   type?: ServerFunc | ClientFunc
) {
   let offset = packet === PacketType.Result ? 5 : 9;
   let buffer = new ArrayBuffer(data.byteLength + offset);
   let view = new DataView(buffer);
   view.setUint8(0, packet);
   view.setUint32(1, requestId || 0);
   if (packet === PacketType.Message) {
      view.setUint32(5, type || 0);
   }
   new Uint8Array(buffer).set(new Uint8Array(data), offset);
   return buffer;
}

function prepareData(json: IRequest | IClientMessage | IServerMessage): string | ArrayBuffer {
   if ('result' in json) {
      // IRequestResult
      if (json.result instanceof ArrayBuffer) {
         // Pack to array
         return createPacket(PacketType.Result, json.result, json.requestId);
      } else {
         return JSON.stringify(json);
      }
   } else if ('data' in json) {
      // IClientMessage or IServerMessage
      if (json.data instanceof ArrayBuffer) {
         // Pack to array
         return createPacket(PacketType.Message, json.data, json.requestId, json.type);
      } else {
         return JSON.stringify(json);
      }
   } else {
      // IRequestError
      return JSON.stringify(json);
   }
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

   export function prepareResult(requestId: number, result: string | ArrayBuffer) {
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

      static prepare(type: ServerFunc, data: string | ArrayBuffer, requestId: number | false) {
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

      static prepare(type: ClientFunc, data: string | ArrayBuffer, requestId: number | false) {
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
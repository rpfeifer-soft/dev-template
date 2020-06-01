/** @format */

import { ServerMethod, ServerFunction, ClientFunction, ClientMethod } from './Functions.js';

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
   type: ServerMethod | ServerFunction;
   data: string | ArrayBuffer;
   requestId?: number;
}

interface IServerMessage {
   type: ClientMethod | ClientFunction;
   data: string | ArrayBuffer;
   requestId?: number;
}

enum PacketType {
   Result = 1,
   Message = 2
}

// Low level support to allow binary transport

// PacketType.Result
// 1 | RequestId (1 Byte) | data
// 2 | RequestId (1 Byte) | type (2 Byte) | data
function parseData<T>(data: string | ArrayBuffer): T {
   if (typeof (data) === 'string') {
      return JSON.parse(data) as T;
   }
   // Arraybuffer
   let view = new DataView(data);
   let packet = view.getUint8(0) as PacketType;
   let requestId = view.getUint8(1);
   let content = data.slice(packet === PacketType.Result ? 2 : 4);

   if (packet === PacketType.Message) {
      // IClientMessage | IServerMessage
      let type = view.getUint16(2);
      return {
         type: type,
         data: content,
         requestId: requestId || undefined
      } as IClientMessage as unknown as T;
   }
   // IRequestResult
   return {
      requestId: requestId,
      result: content
   } as IRequestResult as unknown as T;
}

// PacketType.Result
// 1 | RequestId (1 Byte) | data
// 2 | RequestId (1 Byte) | type (2 Byte) | data
function createPacket(
   packet: PacketType,
   data: ArrayBuffer,
   requestId?: number,
   type?: ServerMethod | ServerFunction | ClientMethod | ClientFunction
) {
   let offset = packet === PacketType.Result ? 2 : 4;
   let buffer = new ArrayBuffer(data.byteLength + offset);
   let view = new DataView(buffer);
   view.setUint8(0, packet);
   view.setUint8(1, requestId || 0);
   if (packet === PacketType.Message) {
      view.setUint16(2, type || 0);
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

      static prepare(type: ServerMethod | ServerFunction, data: string | ArrayBuffer, requestId: number | false) {
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

      static prepare(type: ClientMethod | ClientFunction, data: string | ArrayBuffer, requestId: number | false) {
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
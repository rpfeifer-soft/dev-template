/** @format */

import { ServerFunction, ClientFunction } from './api.js';

interface IRequestError {
   requestId: number;
   error: string;
}

interface IRequestResult {
   requestId: number;
   result: string | ArrayBuffer;
}

type IRequest = IRequestError | IRequestResult;

export interface IBaseMessage {
   data: string | ArrayBuffer;
   requestId?: number;
}

interface IClientMessage extends IBaseMessage {
   type: ServerFunction;
}

interface IServerMessage extends IBaseMessage {
   type: ClientFunction;
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
   const view = new DataView(data);
   const packet = view.getUint8(0) as PacketType;
   const requestId = view.getUint8(1);
   const content = data.slice(packet === PacketType.Result ? 2 : 4);

   if (packet === PacketType.Message) {
      // IClientMessage | IServerMessage
      const type = view.getUint16(2);
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
   type?: ServerFunction | ClientFunction
) {
   const offset = packet === PacketType.Result ? 2 : 4;
   const buffer = new ArrayBuffer(data.byteLength + offset);
   const view = new DataView(buffer);
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
   const json = parseData<T>(data);
   if ('data' in json) {
      return json;
   }
   return false;
}

export function parseRequest(data: string | ArrayBuffer): IRequest | false {
   const json = parseData<IRequest>(data);
   if ('error' in json) {
      return json;
   }

   if ('result' in json) {
      return json;
   }
   return false;
}

export function prepareError(requestId: number, error: string): string | ArrayBuffer {
   const json: IRequestError = {
      requestId,
      error
   };
   return prepareData(json);
}

export function prepareResult(requestId: number, result: string | ArrayBuffer): string | ArrayBuffer {
   const json: IRequestResult = {
      requestId,
      result
   };
   return prepareData(json);
}

export function parseClientMessage(data: string | ArrayBuffer): false | IClientMessage {
   return parseMessage<IClientMessage>(data);
}

export function prepareClientMessage(
   type: ServerFunction,
   data: string | ArrayBuffer,
   requestId: number | false
): string | ArrayBuffer {
   const json: IClientMessage = {
      type,
      requestId: requestId ? requestId : undefined,
      data
   };
   return prepareData(json);
}

export function parseServerMessage(data: string | ArrayBuffer): false | IServerMessage {
   return parseMessage<IServerMessage>(data);
}

export function prepareServerMessage(
   type: ClientFunction,
   data: string | ArrayBuffer,
   requestId: number | false
): string | ArrayBuffer {
   const json: IServerMessage = {
      type,
      requestId: requestId ? requestId : undefined,
      data
   };
   return prepareData(json);
}

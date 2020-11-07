/** @format */

import { IBaseMessage, prepareError, prepareResult, parseRequest } from './webSocketApi.js';
import { Message } from './serialize/Message.js';

interface IRequests {
   [requestId: number]: {
      time: number;
      // tslint:disable-next-line: no-any
      resolve: (value: string | ArrayBuffer) => void;
      // tslint:disable-next-line: no-any
      reject: (reason: string) => void;
   };
}

export interface ISender<TFunction> {
   pushMethod: (
      type: TFunction,
      msg: Message
   ) => void;

   sendFunction: (
      ctor: () => Message,
      type: TFunction,
      msg: Message
   ) => Promise<Message>;
}

export abstract class Sender<TFunction, HFunction> implements ISender<TFunction> {
   // The pending requests
   protected requests: IRequests = {};
   protected nextRequestId = 1;

   // Push a message (result does not matter)
   pushMethod(type: TFunction, msg: Message): void {
      // No requestId necessary
      const data = this.prepare(type, msg.stringify(), false);
      this.sendRequest(data);
   }

   handleMessage(
      type: HFunction,
      ctor: () => Message,
      handler: (msg: Message) => Promise<Message> | void,
      message: IBaseMessage
   ): void {
      const handlerMsg = ctor();
      handlerMsg.parse(message.data);
      const promise = handler(handlerMsg);
      if (promise) {
         if (message.requestId) {
            const requestId = message.requestId;
            promise
               .then(answerMsg => this.answer(requestId, answerMsg))
               .catch(reason => this.error(requestId, reason));
         }
      }
   }

   answer(requestId: number, msg: Message): void {
      const data = prepareResult(requestId, msg.stringify());
      this.sendRequest(data, requestId);
   }

   error(requestId: number, reason: string | Error): void {
      if (typeof reason !== 'string') {
         reason = reason.message;
      }
      const data = prepareError(requestId, reason);
      this.sendRequest(data, requestId);
   }

   async sendFunction<U extends Message>(ctor: () => U, type: TFunction, msg: Message): Promise<U> {
      const promise = new Promise<string>((resolve, reject) => {
         const requestId = this.getNextRequestId();
         const data = this.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      const result = await promise;
      const msgResult = ctor();
      return msgResult.parse(result);
   }

   protected handleRequests(data: string | ArrayBuffer): boolean {
      // Call the handler function
      const request = parseRequest(data);
      if (request === false) {
         return false;
      }

      const foundRequest = this.requests[request.requestId];
      if (foundRequest) {
         // Free the request
         delete this.requests[request.requestId];

         if ('error' in request) {
            foundRequest.reject(request.error);
         } else {
            foundRequest.resolve(request.result);
         }
      }
      return true;
   }

   private sendRequest(
      data: string | ArrayBuffer,
      requestId?: number,
      resolve?: (value: string) => void,
      reject?: (reason: string) => void
   ) {
      if (requestId && resolve && reject) {
         // Handle the returns
         this.requests[requestId] = {
            time: new Date().valueOf(),
            resolve, reject
         };
      }
      this.socketSend(data);
   }

   private getNextRequestId() {
      const requestCacheSize = 256;

      let twice = false;
      let oldest = new Date().valueOf();
      let oldestId = 0;
      while (this.requests[this.nextRequestId]) {
         const request = this.requests[this.nextRequestId];
         if (oldest > request.time) {
            oldest = request.time;
            oldestId = this.nextRequestId;
         }
         if (this.nextRequestId + 1 === requestCacheSize) {
            this.nextRequestId = 1;
            if (twice) {
               // All slots full (search oldest slot)
               this.nextRequestId = oldestId;
               break;
            }
            twice = true;
         } else {
            this.nextRequestId++;
         }
      }
      const next = this.nextRequestId;
      this.nextRequestId = ((this.nextRequestId + 1) % requestCacheSize) || 1;
      return next;
   }

   protected abstract prepare(
      type: TFunction,
      data: string | ArrayBuffer,
      requestId: number | false
   ): string | ArrayBuffer;

   protected abstract socketSend(data: string | ArrayBuffer): void;
}

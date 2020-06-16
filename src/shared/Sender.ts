/** @format */

import WSTool, { IBaseMessage } from './WSTool.js';
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

export abstract class Sender<TFunction, HFunction> {
   // The pending requests
   protected requests: IRequests = {};
   protected nextRequestId = 1;

   // Push a message (result does not matter)
   pushMethod(type: TFunction, msg: Message) {
      // No requestId necessary
      let data = this.prepare(type, msg.stringify(), false);
      this.sendRequest(data);
   }

   handleMessage(
      type: HFunction,
      ctor: () => Message,
      handler: (msg: Message) => Promise<Message> | void,
      message: IBaseMessage
   ) {
      let handlerMsg = ctor();
      handlerMsg.parse(message.data);
      let promise = handler(handlerMsg);
      if (promise) {
         if (message.requestId) {
            let requestId = message.requestId;
            promise
               .then(answerMsg => this.answer(requestId, answerMsg))
               .catch(reason => this.error(requestId, reason));
         }
      }
   }

   answer(requestId: number, msg: Message) {
      let data = WSTool.prepareResult(requestId, msg.stringify());
      this.sendRequest(data, requestId);
   }

   error(requestId: number, reason: string | Error) {
      if (typeof reason !== 'string') {
         reason = reason.message;
      }
      let data = WSTool.prepareError(requestId, reason);
      this.sendRequest(data, requestId);
   }

   async sendFunction<U extends Message>(ctor: () => U, type: TFunction, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.getNextRequestId();
         let data = this.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      const result = await promise;
      let msgResult = ctor();
      return msgResult.parse(result);
   }

   protected handleRequests(data: string | ArrayBuffer) {
      // Call the handler function
      let request = WSTool.parseRequest(data);
      if (request === false) {
         return false;
      }

      let foundRequest = this.requests[request.requestId];
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
         let request = this.requests[this.nextRequestId];
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
      let next = this.nextRequestId;
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

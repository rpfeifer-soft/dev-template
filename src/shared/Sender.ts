/** @format */

import WSTool from './WSTool.js';
import Message from './Message.js';

interface IRequests {
   [requestId: number]: {
      time: number;
      // tslint:disable-next-line: no-any
      resolve: (value: string | ArrayBuffer) => void;
      // tslint:disable-next-line: no-any
      reject: (reason: string) => void;
   };
}

abstract class Sender<TMethod, TFunction> {
   // The pending requests
   protected requests: IRequests = {};
   protected nextRequestId = 1;

   handleRequests(data: string | ArrayBuffer) {
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

   answer(requestId: number, msg: Message) {
      let data = WSTool.prepareResult(requestId, msg.stringify());
      this.sendRequest(data, requestId);
   }

   error(requestId: number, reason: string) {
      let data = WSTool.prepareError(requestId, reason);
      this.sendRequest(data, requestId);
   }

   // Push a message (result does not matter)
   push(type: TMethod, msg: Message) {
      // No requestId necessary
      let data = this.prepare(type, msg.stringify(), false);
      this.sendRequest(data);
   }

   async post(type: TFunction, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.getNextRequestId();
         let data = this.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      await promise;
      return true;
   }

   async send<U extends Message>(ctor: (new () => U), type: TFunction, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.getNextRequestId();
         let data = this.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      const result = await promise;
      let msgResult = new ctor();
      return msgResult.parse(result);
   }

   async getString(type: TFunction, msg: Message) {
      const p = await this.send(Message.String, type, msg);
      return p.data;
   }
   async getNumber(type: TFunction, msg: Message) {
      const p = await this.send(Message.Number, type, msg);
      return p.data;
   }
   async getBoolean(type: TFunction, msg: Message) {
      const p = await this.send(Message.Boolean, type, msg);
      return p.data;
   }
   async getTime(type: TFunction, msg: Message) {
      const p = await this.send(Message.Time, type, msg);
      return p.data;
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

   abstract prepare(
      type: TFunction | TMethod,
      data: string | ArrayBuffer,
      requestId: number | false
   ): string | ArrayBuffer;

   abstract socketSend(data: string | ArrayBuffer): void;
}

export default Sender;
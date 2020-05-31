/** @format */

import WSTool from './wsTool.js';
import Message from './Message.js';

interface IRequests {
   [requestId: number]: {
      // tslint:disable-next-line: no-any
      resolve: (value: string | ArrayBuffer) => void;
      // tslint:disable-next-line: no-any
      reject: (reason: string) => void;
   };
}

abstract class Sender<T> {
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
         delete request[request.requestId];

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
   push(type: T, msg: Message) {
      // No requestId necessary
      let data = this.prepare(type, msg.stringify(), false);
      this.sendRequest(data);
   }

   async post(type: T, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.nextRequestId++;
         let data = this.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      await promise;
      return true;
   }

   async send<U extends Message>(ctor: (new () => U), type: T, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.nextRequestId++;
         let data = this.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      const result = await promise;
      let msgResult = new ctor();
      return msgResult.parse(result);
   }

   async getString(type: T, msg: Message) {
      const p = await this.send(Message.String, type, msg);
      return p.data;
   }
   async getNumber(type: T, msg: Message) {
      const p = await this.send(Message.Number, type, msg);
      return p.data;
   }
   async getBoolean(type: T, msg: Message) {
      const p = await this.send(Message.Boolean, type, msg);
      return p.data;
   }
   async getTime(type: T, msg: Message) {
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
            resolve, reject
         };
      }
      this.socketSend(data);
   }

   abstract prepare(type: T, data: string | ArrayBuffer, requestId: number | false): string | ArrayBuffer;

   abstract socketSend(data: string | ArrayBuffer): void;
}

export default Sender;
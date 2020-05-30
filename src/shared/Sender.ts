/** @format */

import WSTool from './wsTool.js';
import Message from './Message.js';

interface IRequests {
   [requestId: number]: {
      // tslint:disable-next-line: no-any
      resolve: (value: string) => void;
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
      };

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

   abstract prepare(type: T, data: string, requestId: number | false): string | ArrayBuffer;

   // Push a message (result does not matter)
   push(type: T, msg: Message) {
      // No requestId necessary
      let data = this.prepare(type, msg.stringify(), false);
      this.sendRequest(data);
   }

   post(type: T, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.nextRequestId++;
         let data = this.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      return promise
         .then(result => true);
   }

   send<U extends Message>(ctor: (new () => U), type: T, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.nextRequestId++;
         let data = this.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      return promise
         .then(result => {
            let msgResult = new ctor();
            return msgResult.parse(result);
         });
   }

   getString(type: T, msg: Message) {
      return this.send(Message.String, type, msg)
         .then(p => p.data);
   }
   getNumber(type: T, msg: Message) {
      return this.send(Message.Number, type, msg)
         .then(p => p.data);
   }
   getBoolean(type: T, msg: Message) {
      return this.send(Message.Boolean, type, msg)
         .then(p => p.data);
   }
   getTime(type: T, msg: Message) {
      return this.send(Message.Time, type, msg)
         .then(p => p.data);
   }

   abstract socketSend(data: string | ArrayBuffer): void;

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
}

export default Sender;
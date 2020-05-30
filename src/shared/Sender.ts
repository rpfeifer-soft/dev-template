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
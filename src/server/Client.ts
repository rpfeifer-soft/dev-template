/** @format */

import ws from 'ws';
import WSTool from '../shared/wsTool.js';
import Message from '../shared/Message.js';
import ClientFunc from '../shared/ClientFunc.js';
import Clients from './Clients.js';

interface IRequests {
   [requestId: number]: {
      // tslint:disable-next-line: no-any
      resolve: (value: string) => void;
      // tslint:disable-next-line: no-any
      reject: (reason: string) => void;
   };
}

export default class Client {
   // The id of the client
   public readonly id: number;

   // Is the connection alive
   private isAlive = false;

   // The server to use
   private server: ws;

   // The pending requests
   private requests: IRequests = {};
   private nextRequestId = 1;

   // Constructor of the client object
   constructor(id: number, server: ws) {
      this.id = id;
      this.server = server;
   }

   // Init the client
   init() {
      this.isAlive = true;

      this.server.on('pong', () => {
         this.isAlive = true;
      });

      this.server.on('message', (data) => {
         if (typeof (data) !== 'string' && !(data instanceof ArrayBuffer)) {
            throw new Error('Unsupport ws-socket data format!');
         }
         // Call the handler function
         let request = WSTool.parseRequest(data);
         if (request !== false) {

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
            return;
         }
         Clients.handleClientMessage(this, data);
      });
      return this;
   }

   // Check for an active connection
   check() {
      if (!this.isAlive) {
         return false;
      }
      this.isAlive = false;
      this.server.ping();
      return true;
   }

   // Close the connection
   close() {
      this.server.terminate();
      this.isAlive = false;
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
   push(type: ClientFunc, msg: Message) {
      // No requestId necessary
      let data = WSTool.Server.prepare(type, msg.stringify(), false);
      this.sendRequest(data, false);
   }

   post(type: ClientFunc, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.nextRequestId++;
         let data = WSTool.Server.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      return promise
         .then(result => true);
   }

   send<T extends Message>(ctor: (new () => T), type: ClientFunc, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.nextRequestId++;
         let data = WSTool.Server.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      return promise
         .then(result => {
            let msgResult = new ctor();
            return msgResult.parse(result);
         });
   }

   private sendRequest(
      data: string | ArrayBuffer,
      requestId: number | false,
      resolve?: (value: string) => void,
      reject?: (reason: string) => void
   ) {
      if (requestId && resolve && reject) {
         // Handle the returns
         this.requests[requestId] = {
            resolve, reject
         };
      }
      this.server.send(data);
   }
}
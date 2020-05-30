/** @format */

import WSTool from '../shared/wsTool.js';
import Message from '../shared/Message.js';
import { ServerFunc } from '../shared/ServerFunc.js';
import { ClientFunc } from '../shared/ClientFunc.js';
import serverHandler from './ServerHandler.js';

interface IRequests {
   [requestId: number]: {
      // tslint:disable-next-line: no-any
      resolve: (value: string) => void;
      // tslint:disable-next-line: no-any
      reject: (reason: string) => void;
   };
}

class Server {
   public static readonly instance: Server = new Server();

   // The server to use
   private socket: WebSocket;

   // The pending requests
   private requests: IRequests = {};
   private nextRequestId = 1;

   // Init the instance
   init(url: string, onMessage?: (type: ClientFunc, data: string) => void) {
      // Register the correct handler
      let server = this;
      server.socket = new WebSocket(url);

      server.socket.onopen = function () {
         server.send(Message.String, ServerFunc.Init, new Message.String('Hallo!'))
            .then(msg => console.log(msg.data))
            .catch(error => console.error(error));
      };
      // tslint:disable-next-line: typedef
      server.socket.onmessage = (event) => {
         // Call the handler function
         let request = WSTool.parseRequest(event.data);
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
         let message = WSTool.Server.parse(event.data);
         if (message !== false) {
            serverHandler(message.type, message.data, message.requestId || false);
         }
      };
   }

   // Push a message (result does not matter)
   push(type: ServerFunc, msg: Message) {
      // No requestId necessary
      let data = WSTool.Client.prepare(type, msg.stringify(), false);
      this.sendRequest(data);
   }

   post(type: ServerFunc, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.nextRequestId++;
         let data = WSTool.Client.prepare(type, msg.stringify(), requestId);
         this.sendRequest(data, requestId, resolve, reject);
      });
      return promise
         .then(result => true);
   }

   send<T extends Message>(ctor: (new () => T), type: ServerFunc, msg: Message) {
      let promise = new Promise<string>((resolve, reject) => {
         let requestId = this.nextRequestId++;
         let data = WSTool.Client.prepare(type, msg.stringify(), requestId);
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
      this.socket.send(data);
   }
}

export default Server.instance;
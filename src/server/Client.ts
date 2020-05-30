/** @format */

import ws from 'ws';
import WSTool from '../shared/wsTool.js';
import Sender from '../shared/Sender.js';
import ClientFunc from '../shared/ClientFunc.js';
import Clients from './Clients.js';

export default class Client extends Sender<ClientFunc> {
   // The id of the client
   public readonly id: number;

   // Is the connection alive
   private isAlive = false;

   // The server to use
   private server: ws;

   // Constructor of the client object
   constructor(id: number, server: ws) {
      super();
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

   prepare(type: ClientFunc, data: string, requestId: number | false) {
      return WSTool.Server.prepare(type, data, requestId);
   }

   socketSend(data: string | ArrayBuffer) {
      this.server.send(data);
   }
}
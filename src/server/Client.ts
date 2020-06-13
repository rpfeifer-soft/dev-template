/** @format */

import ws from 'ws';
import WSTool from '../shared/WSTool.js';
import Sender from '../shared/Sender.js';
import { ClientFunction, ImplementsServerClient, ServerFunction } from '../shared/Functions.js';
import ClientInfo from '../shared/Data/ClientInfo.js';

interface ClientBase extends ClientInfo { }
class ClientBase extends Sender<ClientFunction, ServerFunction> {
   // The id of the client
   public id: number;

   // Is the connection alive
   private isAlive = false;

   // The server to use
   private server: ws;

   // Constructor of the client object
   constructor(server: ws) {
      super();
      this.server = server;
   }

   // Init the client
   init(handleClientMessage: (client: ClientBase, data: string | ArrayBuffer) => void) {
      this.isAlive = true;

      this.server.on('pong', () => {
         this.isAlive = true;
      });

      this.server.on('message', (data) => {
         if (data instanceof Uint8Array) {
            data = new Uint8Array(data).buffer;
         }
         if (typeof (data) !== 'string' && !(data instanceof ArrayBuffer)) {
            throw new Error('Unsupport ws-socket data format!');
         }
         if (!this.handleRequests(data)) {
            handleClientMessage(this, data);
         }
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

   getClientInfo() {
      let info = new ClientInfo();
      info.id = this.id;
      info.startTime = this.startTime;
      info.userName = this.userName;
      info.userRole = this.userRole;
      info.version = this.version;
      return info;
   }

   protected prepare(type: ClientFunction, data: string | ArrayBuffer, requestId: number | false) {
      return WSTool.Server.prepare(type, data, requestId);
   }

   protected socketSend(data: string | ArrayBuffer) {
      this.server.send(data);
   }
}

class Client extends ImplementsServerClient(ClientBase) {
}

export default Client;
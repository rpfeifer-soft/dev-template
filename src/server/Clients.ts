/** @format */

import ws from 'ws';
import Client from './Client.js';
import Message from '../shared/Message.js';
import { ClientFunc } from '../shared/ClientFunc.js';

class Clients {
   // One singleton
   public static readonly instance: Clients = new Clients();

   // The server to use
   private server: ws.Server;

   // Interval for connection test
   private interval: NodeJS.Timeout;
   private readonly intervalLength = 5000;

   // Save the clients
   private clients: Client[] = [];

   // Check for readyness
   get ready() { return !!this.server; }

   // Init the instance
   init(options: ws.ServerOptions) {
      // Register the correct handler
      let clients = this;
      clients.server = new ws.Server(options);

      clients.server.on('connection', (socket) => {
         // Add the client
         clients.addClient(socket);
      });

      clients.interval = setInterval(() => {
         let closedIds: number[] = [];
         clients.clients.forEach(client => {
            if (!client.check()) {
               client.close();
               closedIds.push(client.id);
            }
         });
         if (closedIds.length > 0) {
            clients.clients = clients.clients
               .filter(client => closedIds.indexOf(client.id) === -1);
         }
      }, clients.intervalLength);

      clients.server.on('close', () => {
         clearInterval(clients.interval);
      });
   }

   // broadcast a message
   broadcast(type: ClientFunc, msg: Message) {
      if (!this.ready) {
         throw new Error('Server not ready. Call init first!');
      }
      // Send to all clients
      this.clients.forEach(client => {
         client.push(type, msg);
      });
   }

   // Add a new client
   private addClient(socket: ws) {
      let client = new Client(this.nextId(), socket);
      // Push to the list, after initializing it
      this.clients.push(client.init());
   }

   // get the next available id for the client
   private nextId() {
      let nextId = new Date().getTime();
      while (this.clients.filter(client => client.id === nextId).length > 0) {
         nextId++;
      }
      return nextId;
   }
}

export default Clients.instance;

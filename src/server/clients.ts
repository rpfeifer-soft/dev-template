/** @format */

import ws from 'ws';
import { Client } from './Client.js';
import { Message } from '../shared/serialize/Message.js';
import { ServerFunction, IServerHandler, implementsServer } from '../shared/communication-api.js';
import { parseClientMessage } from '../shared/websocket-api.js';

interface IFunctionHandler<T extends Message, U extends Message> {
   (msg: T, client: Client): Promise<U> | void;
}

interface IHandlerData<T> {
   ctor: () => Message;
   handler: T;
}

class Handlers {
   private functionHandlers: { [fkey: number]: IHandlerData<IFunctionHandler<Message, Message>>[] } = {};

   addFunction<T extends Message, U extends Message>(
      type: ServerFunction,
      ctor: () => Message,
      handler: IFunctionHandler<T, U>
   ) {
      let handlers = this.functionHandlers[type];
      if (handlers === undefined) {
         handlers = [];
         this.functionHandlers[type] = handlers;
      }
      handlers.push({ ctor, handler });
   }

   removeFunction<T extends Message, U extends Message>(
      type: ServerFunction,
      handler: IFunctionHandler<T, U>
   ) {
      const handlers = this.functionHandlers[type];
      if (handlers) {
         this.functionHandlers[type] = handlers.filter(p => p.handler !== handler);
      }
   }

   getFunctions(type: ServerFunction) {
      return this.functionHandlers[type];
   }
}

type DOnChangedClient = (client: Client) => void;
type DOnRemovedClients = (ids: number[]) => void;

class ClientsBase implements IServerHandler<Client> {
   public dOnChangedClient: DOnChangedClient;
   public dOnRemovedClients: DOnRemovedClients;

   // Save the clients
   private clients: Client[] = [];

   // The server to use
   private server: ws.Server;

   // Interval for connection test
   private interval: NodeJS.Timeout;
   private readonly intervalLength = 5000;

   // The message handlers
   private handlers = new Handlers();

   // Check for readyness
   get ready() {
      return !!this.server;
   }

   // Init the instance
   init(options: ws.ServerOptions) {
      // Register the correct handler
      this.server = new ws.Server(options);

      this.server.on('connection', (socket) => {
         // Add the client
         this.addClient(socket);
      });

      this.interval = setInterval(() => {
         const closedIds: number[] = [];
         this.clients.forEach(client => {
            if (!client.check()) {
               client.close();
               closedIds.push(client.id);
            }
         });
         if (closedIds.length > 0) {
            this.clients = this.clients
               .filter(client => closedIds.indexOf(client.id) === -1);
            // Notify the clients
            this.removedClients(closedIds);
         }
      }, this.intervalLength);

      this.server.on('close', () => {
         clearInterval(this.interval);
      });
   }

   off<T extends Message, U extends Message>(
      type: ServerFunction,
      handler: IFunctionHandler<T, U>
   ) {
      this.handlers.removeFunction(type, handler as IFunctionHandler<T, U>);
   }

   handleClientMessage(client: Client, data: string | ArrayBuffer) {
      const message = parseClientMessage(data);
      if (message === false) {
         return;
      }

      const clientMessage = message;

      const functionHandlers = this.handlers.getFunctions(clientMessage.type);
      if (functionHandlers) {
         functionHandlers.forEach(handlerData => {

            client.handleMessage(
               clientMessage.type,
               handlerData.ctor,
               (msg) => handlerData.handler(msg, client),
               clientMessage);
         });
      }
   }

   onFunction<T extends Message, U extends Message>(
      type: ServerFunction,
      ctor: () => T,
      handler: IFunctionHandler<T, U>
   ) {
      this.handlers.addFunction(type, ctor, handler as IFunctionHandler<T, U>);
   }

   onChangedClient(handler: DOnChangedClient) {
      if (!this.dOnChangedClient) {
         this.dOnChangedClient = handler;
      } else {
         this.dOnChangedClient = ((prevHandler: DOnChangedClient) => {
            return (client: Client) => {
               prevHandler(client);
               handler(client);
            };
         })(this.dOnChangedClient);
      }
   }

   onRemovedClients(handler: DOnRemovedClients) {
      if (!this.dOnRemovedClients) {
         this.dOnRemovedClients = handler;
      } else {
         this.dOnRemovedClients = ((prevHandler: DOnRemovedClients) => {
            return (ids: number[]) => {
               prevHandler(ids);
               handler(ids);
            };
         })(this.dOnRemovedClients);
      }
   }

   changedClient(client: Client) {
      if (this.dOnChangedClient) {
         this.dOnChangedClient(client);
      }
   }

   removedClients(ids: number[]) {
      if (this.dOnRemovedClients) {
         this.dOnRemovedClients(ids);
      }
   }

   add(client: Client) {
      // Analyze the connection info
      const nextId = this.nextId();
      client.id = nextId;
      // Add to the list of clients
      this.clients.push(client);
      // Trigger the change
      this.changedClient(client);
   }

   map<T>(map: (client: Client, index: number) => T): T[] {
      return this.clients.map(map);
   }

   filter<T>(filter: (client: Client, index: number) => boolean): Client[] {
      return this.clients.filter(filter);
   }

   forEach(handler: (client: Client, index: number) => void) {
      this.clients.forEach(handler);
   }

   // Add a new client
   private addClient(socket: ws) {
      const client = new Client(socket);
      // Push to the list, after initializing it
      client.init(this.handleClientMessage.bind(this));
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

class Clients extends implementsServer<Client>()(ClientsBase) {
   // One singleton
   public static readonly instance: Clients = new Clients();
}

export const clients = Clients.instance as Pick<
   Clients,
   'init' | 'ready' | 'on' | 'off' | 'add' |
   'map' | 'filter' | 'forEach' |
   'onChangedClient' | 'onRemovedClients' | 'changedClient'
>;

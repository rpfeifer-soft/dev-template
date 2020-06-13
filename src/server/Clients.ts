/** @format */

import ws from 'ws';
import Client from './Client.js';
import Message from '../shared/Msg/Message.js';
import {
   ServerFunction, ClientFunction,
   IServerHandler, ImplementsServer
} from '../shared/Functions.js';
import WSTool from '../shared/WSTool.js';
import ConnectInfo from '../shared/Data/ConnectInfo.js';
import ClientInfo from '../shared/Data/ClientInfo.js';
import { UserRole } from '../shared/Msg/Types.js';

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
      let handlers = this.functionHandlers[type];
      if (handlers) {
         this.functionHandlers[type] = handlers.filter(p => p.handler !== handler);
      }
   }

   getFunctions(type: ServerFunction) {
      return this.functionHandlers[type];
   }
}

class ClientsBase implements IServerHandler<Client> {
   // Save the clients
   protected clients: Client[] = [];

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
            // Notify the clients
            clients.onClientsChanged(-1);
         }
      }, clients.intervalLength);

      clients.server.on('close', () => {
         clearInterval(clients.interval);
      });
   }

   off<T extends Message, U extends Message>(
      type: ServerFunction,
      handler: IFunctionHandler<T, U>
   ) {
      this.handlers.removeFunction(type, handler as IFunctionHandler<T, U>);
   }

   handleClientMessage(client: Client, data: string | ArrayBuffer) {
      let message = WSTool.Client.parse(data);
      if (message === false) {
         return;
      }

      let clientMessage = message;

      let functionHandlers = this.handlers.getFunctions(clientMessage.type);
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

   // broadcast a message
   broadcastMethod(exceptId: number, type: ClientFunction, msg: Message) {
      if (!this.ready) {
         throw new Error('Server not ready. Call init first!');
      }
      // Send to all clients
      this.clients.forEach(client => {
         if (client.id !== exceptId) {
            client.pushMethod(type, msg);
         }
      });
   }

   onFunction<T extends Message, U extends Message>(
      type: ServerFunction,
      ctor: () => T,
      handler: IFunctionHandler<T, U>
   ) {
      this.handlers.addFunction(type, ctor, handler as IFunctionHandler<T, U>);
   }

   onConnect(client: Client, info: ConnectInfo): ClientInfo | false {
      // Analyze the connection info
      let nextId = this.nextId();
      client.id = nextId;
      client.version = info.version;
      client.startTime = new Date();
      client.userName = '';
      client.userRole = UserRole.Guest;
      // Add to the list of clients
      this.clients.push(client);
      // Send the change
      this.onClientsChanged(client.id);
      // Return the client info to the client
      return client.getClientInfo();
   }

   onClientsChanged(exceptId: number) {
      // overload
   }

   // Add a new client
   private addClient(socket: ws) {
      let client = new Client(socket);
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

class Clients extends ImplementsServer<Client>()(ClientsBase) {
   // One singleton
   public static readonly instance: Clients = new Clients();

   onClientsChanged(exceptId: number) {
      // Send the changed info to the clients
      this.broadcast(exceptId, ClientFunction.ClientsChanged);
   }

   getClientInfos(): ClientInfo[] {
      return this.clients.map(client => client.getClientInfo());
   }
}

export default Clients.instance as Pick<
   Clients,
   'init' | 'ready' | 'on' | 'off' | 'broadcast' |
   'onConnect' | 'getClientInfos'
>;

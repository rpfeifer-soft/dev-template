/** @format */

import ws from 'ws';
import Client from './Client.js';
import Message from '../shared/Message.js';
import { ClientMethod } from '../shared/ClientFunc.js';
import { ServerMethod, ServerFunction, isServerFunction } from '../shared/ServerFunc.js';
import WSTool from '../shared/wsTool.js';

interface IMethodHandler<T extends Message> {
   (msg: T, client: Client): void;
}

interface IFunctionHandler<T extends Message, U extends Message> {
   (msg: T, client: Client): Promise<U>;
}

interface IHandlerData<T> {
   ctor: new () => Message;
   handler: T;
}

class Handlers {
   private methodHandlers: { [fkey: number]: IHandlerData<IMethodHandler<Message>>[] } = {};
   private functionHandlers: { [fkey: number]: IHandlerData<IFunctionHandler<Message, Message>>[] } = {};

   addMethod<T extends Message, U extends Message>(
      type: ServerMethod,
      ctor: new () => Message,
      handler: IMethodHandler<T>
   ) {
      let handlers = this.methodHandlers[type];
      if (handlers === undefined) {
         handlers = [];
         this.methodHandlers[type] = handlers;
      }
      handlers.push({ ctor, handler });
   }

   removeMethod<T extends Message>(
      type: ServerMethod,
      handler: IMethodHandler<T>
   ) {
      let handlers = this.methodHandlers[type];
      if (handlers) {
         this.methodHandlers[type] = handlers.filter(p => p.handler !== handler);
      }
   }

   getMethods(type: ServerMethod) {
      return this.methodHandlers[type];
   }

   addFunction<T extends Message, U extends Message>(
      type: ServerFunction,
      ctor: new () => Message,
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
         }
      }, clients.intervalLength);

      clients.server.on('close', () => {
         clearInterval(clients.interval);
      });
   }

   on<T extends Message, U extends Message>(
      type: ServerMethod,
      ctor: new () => T,
      handler: IMethodHandler<T>
   ): void;

   on<T extends Message, U extends Message>(
      type: ServerFunction,
      ctor: new () => T,
      handler: IFunctionHandler<T, U>
   ): void;

   on<T extends Message, U extends Message>(
      type: ServerMethod | ServerFunction,
      ctor: new () => T,
      handler: IMethodHandler<T> | IFunctionHandler<T, U>
   ) {
      if (isServerFunction(type)) {
         this.handlers.addFunction(type, ctor, handler as IFunctionHandler<T, U>);
      } else {
         this.handlers.addMethod(type, ctor, handler as IMethodHandler<T>);
      }
   }

   off<T extends Message, U extends Message>(
      type: ServerMethod | ServerFunction,
      handler: IMethodHandler<T> | IFunctionHandler<T, U>
   ) {
      if (isServerFunction(type)) {
         this.handlers.removeFunction(type, handler as IFunctionHandler<T, U>);
      } else {
         this.handlers.removeMethod(type, handler as IMethodHandler<T>);
      }
   }

   handleClientMessage(client: Client, data: string | ArrayBuffer) {
      let message = WSTool.Client.parse(data);
      if (message === false) {
         return;
      }

      let clientMessage = message;
      if (isServerFunction(clientMessage.type)) {
         let functionHandlers = this.handlers.getFunctions(clientMessage.type);
         if (functionHandlers) {
            functionHandlers.forEach(handlerData => {
               let handlerMsg = new handlerData.ctor();
               handlerMsg.parse(clientMessage.data);
               let promise = handlerData.handler(handlerMsg, client);
               if (clientMessage.requestId) {
                  let requestId = clientMessage.requestId;
                  promise.then(answerMsg => client.answer(requestId, answerMsg));
               }
            });
         }
      } else {
         let methodHandlers = this.handlers.getMethods(clientMessage.type);
         if (methodHandlers) {
            methodHandlers.forEach(handlerData => {
               let handlerMsg = new handlerData.ctor();
               handlerMsg.parse(clientMessage.data);
               handlerData.handler(handlerMsg, client);
            });
         }
      }
   }

   // broadcast a message
   broadcast(type: ClientMethod, msg: Message) {
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

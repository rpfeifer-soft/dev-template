/** @format */

import WSTool from '../shared/WSTool.js';
import Message from '../shared/Message.js';
import Sender from '../shared/Sender.js';
import {
   ServerMethod, ServerFunction, ClientMethod, ClientFunction,
   isClientFunction, IClientHandler, ImplementsClient
} from '../shared/Functions.js';

interface IMethodHandler<T extends Message> {
   (msg: T): void;
}

interface IFunctionHandler<T extends Message, U extends Message> {
   (msg: T): Promise<U>;
}

interface IHandlerData<T> {
   ctor: new () => Message;
   handler: T;
}

class Handlers {
   private methodHandlers: { [fkey: number]: IHandlerData<IMethodHandler<Message>>[] } = {};
   private functionHandlers: { [fkey: number]: IHandlerData<IFunctionHandler<Message, Message>>[] } = {};

   addMethod<T extends Message, U extends Message>(
      type: ClientMethod,
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
      type: ClientMethod,
      handler: IMethodHandler<T>
   ) {
      let handlers = this.methodHandlers[type];
      if (handlers) {
         this.methodHandlers[type] = handlers.filter(p => p.handler !== handler);
      }
   }

   getMethods(type: ClientMethod) {
      return this.methodHandlers[type];
   }

   addFunction<T extends Message, U extends Message>(
      type: ClientFunction,
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
      type: ClientFunction,
      handler: IFunctionHandler<T, U>
   ) {
      let handlers = this.functionHandlers[type];
      if (handlers) {
         this.functionHandlers[type] = handlers.filter(p => p.handler !== handler);
      }
   }

   getFunctions(type: ClientFunction) {
      return this.functionHandlers[type];
   }
}

class ServerBase extends Sender<ServerMethod, ServerFunction> implements IClientHandler {
   // The server to use
   socket: WebSocket;

   // The message handlers
   handlers = new Handlers();

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   async callInit(msgInit: any): Promise<Message> {
      return new Message.Boolean(false);;
   }

   // Init the instance
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   initServer(url: string, msgInit: any) {
      // Register the correct handler
      let server = this;
      server.socket = new WebSocket(url);
      server.socket.binaryType = 'arraybuffer';

      return new Promise<Message>((resolve, reject) => {
         server.socket.onopen = function () {
            server.callInit(msgInit)
               .then(msg => resolve(msg))
               .catch(error => reject(error));
         };
         // tslint:disable-next-line: typedef
         server.socket.onmessage = async (event) => {
            let data = event.data;
            if (event.data instanceof Blob) {
               data = await new Response(event.data).arrayBuffer();
            }
            if (typeof (data) !== 'string' && !(data instanceof ArrayBuffer)) {
               throw new Error('Unsupport ws-socket data format!');
            }
            if (!this.handleRequests(data)) {
               this.handleClientMessage(data);
            }
         };
      });
   }

   off<T extends Message, U extends Message>(
      type: ClientMethod,
      handler: IMethodHandler<T>
   ): void;
   off<T extends Message, U extends Message>(
      type: ClientFunction,
      handler: IFunctionHandler<T, U>
   ): void;
   off<T extends Message, U extends Message>(
      type: ClientMethod | ClientFunction,
      handler: IMethodHandler<T> | IFunctionHandler<T, U>
   ) {
      if (isClientFunction(type)) {
         this.handlers.removeFunction(type, handler as IFunctionHandler<T, U>);
      } else {
         this.handlers.removeMethod(type, handler as IMethodHandler<T>);
      }
   }

   handleClientMessage(data: string | ArrayBuffer) {
      let message = WSTool.Server.parse(data);
      if (message === false) {
         return;
      }

      let serverMessage = message;
      if (isClientFunction(serverMessage.type)) {
         let functionHandlers = this.handlers.getFunctions(serverMessage.type);
         if (functionHandlers) {
            functionHandlers.forEach(handlerData => {
               let handlerMsg = new handlerData.ctor();
               handlerMsg.parse(serverMessage.data);
               let promise = handlerData.handler(handlerMsg);
               if (serverMessage.requestId) {
                  let requestId = serverMessage.requestId;
                  promise
                     .then(answerMsg => this.answer(requestId, answerMsg))
                     .catch(reason => this.error(requestId, reason));
               }
            });
         }
      } else {
         let methodHandlers = this.handlers.getMethods(serverMessage.type);
         if (methodHandlers) {
            methodHandlers.forEach(handlerData => {
               let handlerMsg = new handlerData.ctor();
               handlerMsg.parse(serverMessage.data);
               handlerData.handler(handlerMsg);
            });
         }
      }
   }

   prepare(type: ServerMethod | ServerFunction, data: string | ArrayBuffer, requestId: number | false) {
      return WSTool.Client.prepare(type, data, requestId);
   }

   socketSend(data: string | ArrayBuffer) {
      this.socket.send(data);
   }

   onMethod<T extends Message>(
      type: ClientMethod,
      ctor: new () => T,
      handler: IMethodHandler<T>
   ) {
      return this.onMethodOrFunction(type, ctor, handler);
   }

   onFunction<T extends Message, U extends Message>(
      type: ClientFunction,
      ctor: new () => T,
      handler: IFunctionHandler<T, U>
   ) {
      return this.onMethodOrFunction(type, ctor, handler);
   }

   private onMethodOrFunction<T extends Message, U extends Message>(
      type: ClientMethod | ClientFunction,
      ctor: new () => T,
      handler: IMethodHandler<T> | IFunctionHandler<T, U>
   ) {
      if (isClientFunction(type)) {
         this.handlers.addFunction(type, ctor, handler as IFunctionHandler<T, U>);
      } else {
         this.handlers.addMethod(type, ctor, handler as IMethodHandler<T>);
      }
   }
}

class Server extends ImplementsClient(ServerBase) {
   // One singleton
   public static readonly instance: Server = new Server();

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   callInit(msgInit: any): Promise<Message> {
      return this.call(ServerFunction.Init, msgInit);
   }
}

export default Server.instance as Pick<
   Server,
   'init' | 'on' | 'off' | 'call'
>;
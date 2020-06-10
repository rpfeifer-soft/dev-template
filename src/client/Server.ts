/** @format */

import WSTool from '../shared/WSTool.js';
import Message, { Bool } from '../shared/Message.js';
import Sender from '../shared/Sender.js';
import {
   ServerFunction, ClientFunction,
   IClientHandler, ImplementsClient
} from '../shared/Functions.js';

interface IFunctionHandler<T extends Message, U extends Message> {
   (msg: T): Promise<U> | void;
}

interface IHandlerData<T> {
   ctor: new () => Message;
   handler: T;
}

class Handlers {
   private functionHandlers: { [fkey: number]: IHandlerData<IFunctionHandler<Message, Message>>[] } = {};

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

class ServerBase extends Sender<ServerFunction, ServerFunction> implements IClientHandler {
   // The server to use
   socket: WebSocket;

   // The message handlers
   handlers = new Handlers();

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   async callInit(msgInit: any): Promise<Message> {
      return new Bool(false);;
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
      type: ClientFunction,
      handler: IFunctionHandler<T, U>
   ) {
      this.handlers.removeFunction(type, handler as IFunctionHandler<T, U>);
   }

   handleClientMessage(data: string | ArrayBuffer) {
      let message = WSTool.Server.parse(data);
      if (message === false) {
         return;
      }

      let serverMessage = message;

      let functionHandlers = this.handlers.getFunctions(serverMessage.type);
      if (functionHandlers) {
         functionHandlers.forEach(handlerData => {
            let handlerMsg = new handlerData.ctor();
            handlerMsg.parse(serverMessage.data);
            let promise = handlerData.handler(handlerMsg);
            if (promise) {
               if (serverMessage.requestId) {
                  let requestId = serverMessage.requestId;
                  promise
                     .then(answerMsg => this.answer(requestId, answerMsg))
                     .catch(reason => this.error(requestId, reason));
               }
            }
         });
      }
   }

   prepare(type: ServerFunction, data: string | ArrayBuffer, requestId: number | false) {
      return WSTool.Client.prepare(type, data, requestId);
   }

   socketSend(data: string | ArrayBuffer) {
      this.socket.send(data);
   }

   onFunction<T extends Message, U extends Message>(
      type: ClientFunction,
      ctor: new () => T,
      handler: IFunctionHandler<T, U>
   ) {
      this.handlers.addFunction(type, ctor, handler as IFunctionHandler<T, U>);
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
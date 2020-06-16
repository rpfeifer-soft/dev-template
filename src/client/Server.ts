/** @format */

import WSTool from '../shared/WSTool.js';
import Message from '../shared/msg/Message.js';
import Sender from '../shared/Sender.js';
import {
   ServerFunction, ClientFunction,
   IClientHandler, ImplementsClient
} from '../shared/Functions.js';
import ClientInfo from '../shared/data/ClientInfo.js';

interface IFunctionHandler<T extends Message, U extends Message> {
   (msg: T): Promise<U> | void;
}

interface IHandlerData<T> {
   ctor: () => Message;
   handler: T;
}

class Handlers {
   private functionHandlers: { [fkey: number]: IHandlerData<IFunctionHandler<Message, Message>>[] } = {};

   addFunction<T extends Message, U extends Message>(
      type: ClientFunction,
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

type DOnChangeMe = () => void;

class ServerBase extends Sender<ServerFunction, ClientFunction> implements IClientHandler {
   public dOnChangeMe: DOnChangeMe;

   // The server to use
   socket: WebSocket;

   // The message handlers
   handlers = new Handlers();

   // Infos about the current client
   me?: ClientInfo;

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   async callInit(ctor: () => Message, msgInit: Message): Promise<Message> {
      return ctor();
   }

   // Init the instance
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   initServer(url: string, ctor: () => Message, msgInit: Message) {
      // Register the correct handler
      let serverBase = this;
      serverBase.socket = new WebSocket(url);
      serverBase.socket.binaryType = 'arraybuffer';

      return new Promise<Message>((resolve, reject) => {
         serverBase.socket.onopen = function () {
            serverBase.callInit(ctor, msgInit)
               .then(msg => resolve(msg))
               .catch(error => reject(error));
         };
         // tslint:disable-next-line: typedef
         serverBase.socket.onmessage = async (event) => {
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
            this.handleMessage(
               serverMessage.type,
               handlerData.ctor,
               handlerData.handler,
               serverMessage
            );
         });
      }
   }

   prepare(type: ServerFunction, data: string | ArrayBuffer, requestId: number | false) {
      return WSTool.Client.prepare(type, data, requestId);
   }

   socketSend(data: string | ArrayBuffer) {
      this.socket.send(data);
   }

   setMe(me: ClientInfo) {
      this.me = me;
      if (this.dOnChangeMe) {
         this.dOnChangeMe();
      }
   }

   onChangeMe(handler: DOnChangeMe) {
      if (!this.dOnChangeMe) {
         this.dOnChangeMe = handler;
      } else {
         this.dOnChangeMe = ((prevHandler: DOnChangeMe) => {
            return () => {
               prevHandler();
               handler();
            };
         })(this.dOnChangeMe);
      }
   }

   onFunction<T extends Message, U extends Message>(
      type: ClientFunction,
      ctor: () => T,
      handler: IFunctionHandler<T, U>
   ) {
      this.handlers.addFunction(type, ctor, handler as IFunctionHandler<T, U>);
   }
}

class ServerClass extends ImplementsClient(ServerBase) {
   // One singleton
   public static readonly instance: ServerClass = new ServerClass();

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   callInit(ctor: () => Message, msgInit: Message): Promise<Message> {
      return this.sendFunction(ctor, ServerFunction.Connect, msgInit);
   }
}

// The singleton is the return
export const server = ServerClass.instance as Pick<
   ServerClass,
   'init' | 'on' | 'off' | 'call' |
   'me' | 'setMe' | 'onChangeMe'>;

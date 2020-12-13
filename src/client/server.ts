/** @format */

import { Message } from '../shared/serialize/Message.js';
import { Sender } from '../shared/Sender.js';
import { applyCallsToServer } from '../shared/mixins/applyCallsToServer.js';
import { applyListenersOnClient } from '../shared/mixins/applyListenersOnClient.js';
import { applyInitForClient } from '../shared/mixins/applyInitForClient.js';
import { ServerFunction, ClientFunction } from '../shared/api.js';
import { ClientInfo } from '../shared/data/ClientInfo.js';
import { parseServerMessage, prepareClientMessage } from '../shared/webSocketApi.js';
import { t } from '../shared/i18n/ttag.js';

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
      const handlers = this.functionHandlers[type];
      if (handlers) {
         this.functionHandlers[type] = handlers.filter(p => p.handler !== handler);
      }
   }

   getFunctions(type: ClientFunction) {
      return this.functionHandlers[type];
   }
}

type DOnChangeMe = () => void;

class ServerBase extends Sender<ServerFunction, ClientFunction> {
   public dOnChangeMe: DOnChangeMe;

   // The server to use
   socket: WebSocket;

   // The message handlers
   handlers = new Handlers();

   // Infos about the current client
   me?: ClientInfo;

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async callInit(ctor: () => Message, msgInit: Message): Promise<Message> {
      return ctor();
   }

   // Init the instance
   initServer(url: string, ctor: () => Message, msgInit: Message) {
      // Register the correct handler
      this.socket = new WebSocket(url);
      this.socket.binaryType = 'arraybuffer';

      return new Promise<Message>((resolve, reject) => {
         this.socket.onopen = () => {
            this.callInit(ctor, msgInit)
               .then(msg => resolve(msg))
               .catch(error => reject(error));
         };
         // tslint:disable-next-line: typedef
         this.socket.onmessage = async (event) => {
            let data = event.data;
            if (event.data instanceof Blob) {
               data = await new Response(event.data).arrayBuffer();
            }
            if (typeof (data) !== 'string' && !(data instanceof ArrayBuffer)) {
               throw new TypeError(t`Nicht unterstütztes Websocket-Format!`);
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
      const message = parseServerMessage(data);
      if (message === false) {
         return;
      }

      const serverMessage = message;

      const functionHandlers = this.handlers.getFunctions(serverMessage.type);
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
      return prepareClientMessage(type, data, requestId);
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

   isConnected() {
      return this.socket.readyState === WebSocket.OPEN ||
         this.socket.readyState === WebSocket.CONNECTING;
   }
}

class ServerClass extends
   applyInitForClient(
      applyListenersOnClient(
         applyCallsToServer(ServerBase))) {
   // One singleton
   public static readonly instance: ServerClass = new ServerClass();

   callInit(ctor: () => Message, msgInit: Message): Promise<Message> {
      return this.sendFunction(ctor, ServerFunction.Connect, msgInit);
   }
}

// The singleton is the return
export const server = ServerClass.instance as Pick<
   ServerClass,
   'init' | 'on' | 'off' | 'call' |
   'me' | 'setMe' | 'onChangeMe' | 'isConnected'>;

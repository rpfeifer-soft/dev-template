/** @format */

import WSTool from '../shared/wsTool.js';
import Message from '../shared/Message.js';
import Sender from '../shared/Sender.js';
import ServerFunc from '../shared/ServerFunc.js';
import ClientFunc from '../shared/ClientFunc.js';

interface IMessageHandler {
   (data: string, requestId: number | false): void;
}

type IHandlers = { [key in ClientFunc]?: IMessageHandler[] };

class Server extends Sender<ServerFunc> {
   public static readonly instance: Server = new Server();

   // The server to use
   private socket: WebSocket;

   // The message handlers
   private handlers: IHandlers = {};

   // Init the instance
   init<T extends Message>(url: string, msgInit: Message, ctor?: new () => T) {
      // Register the correct handler
      let server = this;
      server.socket = new WebSocket(url);

      return new Promise<T>((resolve, reject) => {
         server.socket.onopen = function () {
            if (ctor) {
               server.send(ctor, ServerFunc.Init, msgInit)
                  .then(msg => resolve(msg))
                  .catch(error => reject(error));
            } else {
               server.post(ServerFunc.Init, msgInit)
                  .catch(error => reject(error));
            }
         };
         // tslint:disable-next-line: typedef
         server.socket.onmessage = (event) => {
            if (typeof (event.data) !== 'string' && !(event.data instanceof ArrayBuffer)) {
               throw new Error('Unsupport ws-socket data format!');
            }
            if (!this.handleRequests(event.data)) {
               this.handleClientMessage(event.data);
            }
         };
      });
   }

   on(type: ClientFunc, handler: IMessageHandler) {
      let handlers = this.handlers[type];
      if (handlers === undefined) {
         handlers = [];
         this.handlers[type] = handlers;
      }
      handlers.push(handler);
   }

   off(type: ClientFunc, handler: IMessageHandler) {
      let handlers = this.handlers[type];
      if (handlers) {
         this.handlers[type] = handlers.filter(p => p !== handler);
      }
   }

   handleClientMessage(data: string | ArrayBuffer) {
      let message = WSTool.Server.parse(data);
      if (message !== false) {
         let msg = message;
         let handlers = this.handlers[msg.type];
         if (handlers) {

            handlers.forEach(handler => {
               handler(msg.data, msg.requestId || false);
            });
         }
      }
   }

   prepare(type: ServerFunc, data: string, requestId: number | false) {
      return WSTool.Client.prepare(type, data, requestId);
   }

   socketSend(data: string | ArrayBuffer) {
      this.socket.send(data);
   }
}

export default Server.instance;
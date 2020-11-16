/** @format */

import ws from 'ws';
import { Sender } from '../shared/Sender.js';
import { ClientFunction, ServerFunction } from '../shared/api.js';
import { applyCallsToClient } from '../shared/mixins/applyCallsToClient.js';
import { ClientInfo } from '../shared/data/ClientInfo.js';
import { prepareServerMessage } from '../shared/webSocketApi.js';
import { Language, UserRole } from '../shared/types.js';
import { t, useLocale } from '../shared/i18n/ttag.js';

class ClientBase extends Sender<ClientFunction, ServerFunction> {
   // The id of the client
   id: number;
   startTime: Date;
   version: string;
   browser: string;
   language: Language;
   sessionId: string;
   userName: string;
   userRole: UserRole;

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
            throw new TypeError(t`Nicht unterstütztes Websocket-Format!`);
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

   useLocale() {
      useLocale(this.language);
   }

   getClientInfo() {
      return ClientInfo.copy(this);
   }

   setClientInfo(info: ClientInfo) {
      ClientInfo.set(this, info);
   }

   syncSessionInfo(info: ClientInfo) {
      ClientInfo.syncSession(this, info);
   }

   protected prepare(type: ClientFunction, data: string | ArrayBuffer, requestId: number | false) {
      return prepareServerMessage(type, data, requestId);
   }

   protected socketSend(data: string | ArrayBuffer) {
      this.server.send(data);
   }
}

export class Client extends applyCallsToClient(ClientBase) {
}

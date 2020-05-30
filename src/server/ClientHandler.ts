/** @format */

import Client from './Client.js';
import Clients from './Clients.js';
import { ServerFunc } from '../shared/ServerFunc.js';
import Message from '../shared/Message.js';
import { ClientFunc } from '../shared/ClientFunc.js';

interface IOnMessage {
   (client: Client, type: ServerFunc, data: string, requestId: number | false): void;
}

const onMessage: IOnMessage = function (
   client: Client,
   type: ServerFunc,
   data: string,
   requestId: number | false
) {
   // tslint:disable-next-line: no-console
   console.log('handler ' + client.id + ': ' + type + ' (' + data + ')');

   if (type === ServerFunc.Init) {
      let initMsg = Message.String.parse(data);
      if (requestId) {
         client.answer(requestId,
            new Message.String(initMsg.data ? initMsg.data + ' ' + client.id : 'No data!'));
      }
   }
   if (type === ServerFunc.Click) {
      Clients.broadcast(ClientFunc.ClickFromClient, Message.Time.parse(data));
   }
};
export default onMessage;
/** @format */

import { ClientFunc } from '../shared/ClientFunc.js';

interface IOnMessage {
   (type: ClientFunc, data: string, requestId: number | false): void;
}

const onMessage: IOnMessage = function (
   type: ClientFunc,
   data: string,
   requestId: number | false
) {
   // tslint:disable-next-line: no-console
   console.log('handler ' + type + ' (' + data + ') - ' + requestId);
};
export default onMessage;

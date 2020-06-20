/** @format */

import { ConnectInfo as ConnectInfoBase } from './ConnectInfo.js';
import { ClientInfo as ClientInfoBase } from './ClientInfo.js';
import { addLanguage } from './addLanguage.js';
import { addLogin, addLoginWithoutUserRole } from './addLogin.js';

export class ConnectInfo extends
   addLoginWithoutUserRole(
      addLanguage(
         ConnectInfoBase
      )
   ) { }

export const fConnectInfo = new ConnectInfo().getFactory();

export class ClientInfo extends
   addLogin(
      addLanguage(
         ClientInfoBase
      )
   ) { }

export const fClientInfo = new ClientInfo().getFactory();

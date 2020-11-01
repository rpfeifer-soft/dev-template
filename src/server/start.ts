/** @format */

// read options
import express from 'express';
import { options } from './options.js';
import { clients } from './clients.js';
import { index } from './index.js';
import { env, IUserLogin } from './env/env.js';
import { userRoles, UserRole } from '../shared/types.js';
import { t } from '../shared/i18n/ttag.js';

const server = express();

const userLogin: IUserLogin = {
   async getAuthCode(userName: string) {
      return userName.split('').reverse().join('');
   },

   async getUserRole(userName: string) {
      return userName === 'René' ? userRoles(UserRole.Admin, UserRole.User) : UserRole.User;
   }
};

server.listen(options.getPort(), () => {

   // Handle the requests
   server.use('/', express.static(options.getProdPath()));

   server.get('/', (req, res) => {
      res.send(index());
   });

   // eslint-disable-next-line no-console
   console.log(t`Lauschen an Port ${options.getPort()}`);

   // Init the env
   env.onInit(userLogin);
});

clients.init({ port: options.getPortWebSockets() });

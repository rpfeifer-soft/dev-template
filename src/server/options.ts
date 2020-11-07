/** @format */
/* eslint-disable no-console */

import * as fs from 'fs';

interface ISecrets {
   port: number;
   portWebSockets: number;
   baseUrl: string;
   prodPath: string;
   production: boolean;
}

class Options {
   secrets: ISecrets;

   constructor() {
      if (!process.env.SECRETS) {
         throw new Error('No secrets-file specified!');
      }
      this.secrets = JSON.parse(
         fs.readFileSync(process.env.SECRETS, {
            encoding: 'utf8'
         })
      );
      this.dump('server');
   }

   isProduction() {
      return this.secrets.production;
   }

   getVersion() {
      return process.env.npm_package_version;
   }

   getPort() {
      return this.secrets.port;
   }

   getPortWebSockets() {
      return this.secrets.portWebSockets;
   }

   getBaseUrl(path?: string) {
      return `${this.secrets.baseUrl}${path || ''}`;
   }

   getProdPath(path?: string) {
      return `${this.secrets.prodPath}${path || ''}`;
   }

   getTitle() {
      return process.env.npm_package_title;
   }

   dump(name: string) {
      console.log('Application:', name, `(:${this.getPort()})`);
      console.log('------------------');
      console.log('Title:', this.getTitle());
      console.log('Mode:', this.isProduction() ? 'Production' : 'Development');
      console.log('Port (WebSockets):', this.getPortWebSockets());
      console.log('BaseUrl:', this.getBaseUrl());
      console.log('ProdPath:', this.getProdPath());
      console.log('Version:', this.getVersion());
   }
}

export const options = new Options();

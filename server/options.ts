/** @format */

import * as fs from 'fs';

interface ISecrets {
   port: number;
   baseUrl: string;
   prodPath: string;
}

class Options {
   secrets: ISecrets;

   constructor() {
      if (!process.env.SECRETS) {
         throw Error('No secrets-file specified!');
      }
      this.secrets = JSON.parse(
         fs.readFileSync(process.env.SECRETS, {
            encoding: 'utf8'
         })
      );
      this.dump('server');
   }

   isRelease() {
      return process.env.RELEASE === 'true';
   }

   getVersion() {
      return process.env.npm_package_version;
   }

   getPort() {
      return this.secrets.port;
   }

   getBaseUrl(path?: string) {
      return `${this.secrets.baseUrl}${path || ''}`;
   }

   getProdPath(path?: string) {
      return `${this.secrets.prodPath}${path || ''}`;
   }

   dump(name: string) {
      // tslint:disable:no-console
      console.log('Application:', name, `(:${this.secrets.port})`);
      console.log('------------------');
      console.log('Mode:', this.isRelease() ? 'RELEASE' : 'DEV');
      console.log('BaseUrl:', this.getBaseUrl());
      console.log('ProdPath:', this.getProdPath());
      console.log('Version:', this.getVersion());
   }
}

const options = new Options();

export default options;

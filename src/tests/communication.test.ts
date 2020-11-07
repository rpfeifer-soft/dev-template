/** @format */

import test from 'tape';
import { ServerFunction, ClientFunction } from '../shared/api.js';
import * as ServerFunctions from '../shared/apiServer.js';
import * as ClientFunctions from '../shared/apiClient.js';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: Functions tests\x1b[0m');

function testServerEnums() {
   const functions = Object.keys(ServerFunction).map(p => +p).filter(p => !Number.isNaN(p));
   functions.forEach(p => {
      try {
         ServerFunctions.getParameter(p);
      } catch {
         throw new Error(`Missing api-definition for ServerFunction.${ServerFunction[p]}`);
      }
      // eslint-disable-next-line no-bitwise
      if (p >= (1 << 16)) {
         throw new Error(`Exceeding upper limit by ServerFunction.${ServerFunction[p]} (${p})`);
      }
   });
}

function testClientEnums() {
   const functions = Object.keys(ClientFunction).map(p => +p).filter(p => !Number.isNaN(p));
   functions.forEach(p => {
      try {
         ClientFunctions.getParameter(p);
      } catch {
         throw new Error(`Missing api-definition for ClientFunction.${ClientFunction[p]}`);
      }
      // eslint-disable-next-line no-bitwise
      if (p >= (1 << 16)) {
         throw new Error(`Exceeding upper limit by ClientFunction.${ClientFunction[p]} (${p})`);
      }
   });
}

test('Check for distinct server-enum-types', (assert) => {
   assert.doesNotThrow(testServerEnums);
   assert.end();
});

test('Check for distinct client-enum-types', (assert) => {
   assert.doesNotThrow(testClientEnums);
   assert.end();
});

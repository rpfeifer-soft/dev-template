/** @format */

import test from 'tape';
import { ServerFunction, ServerFunctions, ClientFunction, ClientFunctions } from '../shared/Functions.js';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: Functions tests\x1b[0m');

function testServerEnums() {
   let functions = Object.keys(ServerFunction).map(p => +p).filter(p => !isNaN(p));
   functions.forEach(p => {
      if (!ServerFunctions.getApi(p)) {
         throw new Error(`Missing api-definition for ServerFunction.${ServerFunction[p]}`);
      }
      // eslint-disable-next-line no-bitwise
      if (p >= (1 << 16)) {
         throw new Error(`Exceeding upper limit by ServerFunction.${ServerFunction[p]} (${p})`);
      }
   });
}

function testClientEnums() {
   let functions = Object.keys(ClientFunction).map(p => +p).filter(p => !isNaN(p));
   functions.forEach(p => {
      if (!ClientFunctions.getApi(p)) {
         throw new Error(`Missing api-definition for ServerFunction.${ServerFunction[p]}`);
      }
      // eslint-disable-next-line no-bitwise
      if (p >= (1 << 16)) {
         throw new Error(`Exceeding upper limit by ServerFunction.${ServerFunction[p]} (${p})`);
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

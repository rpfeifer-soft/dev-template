/** @format */

import test from 'tape';
import {
   ServerFunction, ServerMethod, ClientFunction, ClientMethod,
   isServerFunction, isClientFunction
} from './Functions.js';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: Functions tests\x1b[0m');

function testServerEnums() {
   // eslint-disable-next-line no-console
   let functions = Object.keys(ServerFunction).map(p => +p).filter(p => !isNaN(p));
   let methods = Object.keys(ServerMethod).map(p => +p).filter(p => !isNaN(p));
   functions.forEach(p => {
      if (methods.indexOf(p) !== -1) {
         throw new Error(`Duplicate value ${p} (${ServerFunction[p]} <=> ${ServerMethod[p]})`);
      }
   });
   functions.forEach(p => {
      if (!isServerFunction(p)) {
         throw new Error(`Wrong type check ${ServerFunction[p]} is flagged as not function!`);
      }
   });
   methods.forEach(p => {
      if (isServerFunction(p)) {
         throw new Error(`Wrong type check ${ServerMethod[p]} is flagged as function!`);
      }
   });
}

function testClientEnums() {
   // eslint-disable-next-line no-console
   let functions = Object.keys(ClientFunction).map(p => +p).filter(p => !isNaN(p));
   let methods = Object.keys(ClientMethod).map(p => +p).filter(p => !isNaN(p));
   functions.forEach(p => {
      if (methods.indexOf(p) !== -1) {
         throw new Error(`Duplicate value ${p} (${ClientFunction[p]} <=> ${ClientMethod[p]})`);
      }
   });
   functions.forEach(p => {
      if (!isClientFunction(p)) {
         throw new Error(`Wrong type check ${ClientFunction[p]} is flagged as not function!`);
      }
   });
   methods.forEach(p => {
      if (isClientFunction(p)) {
         throw new Error(`Wrong type check ${ClientMethod[p]} is flagged as function!`);
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

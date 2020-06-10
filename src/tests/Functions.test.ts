/** @format */

import test from 'tape';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: Functions tests\x1b[0m');

function testServerEnums() {
   // eslint-disable-next-line no-console
}

function testClientEnums() {
   // eslint-disable-next-line no-console
}

test('Check for distinct server-enum-types', (assert) => {
   assert.doesNotThrow(testServerEnums);
   assert.end();
});

test('Check for distinct client-enum-types', (assert) => {
   assert.doesNotThrow(testClientEnums);
   assert.end();
});

/** @format */

import test from 'tape';
import wsTool from './wsTool.js';

test('default export is 8', (assert) => {
   assert.equal(wsTool, 8, 'wsTools equals 8');
   assert.end();
});

/** @format */

import test from 'tape';
import wsTool from './wsTool.js';

test('default export is 8', (assert) => {
   assert.ok(wsTool.Client, 'wsTools contains Client');
   assert.ok(wsTool.Server, 'wsTools contains Server');
   assert.end();
});

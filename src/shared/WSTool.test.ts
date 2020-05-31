/** @format */

import test from 'tape';
import WSTool from './WSTool.js';

test('default export is 8', (assert) => {
   assert.ok(WSTool.Client, 'WSTools contains Client');
   assert.ok(WSTool.Server, 'WSTools contains Server');
   assert.end();
});

/** @format */

import test from 'tape';
import { clients } from '../server/_clients.js';
// import Message from '../shared/Message.js';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: Clients\x1b[0m');

test('Need a singleton instance of Clients', (assert) => {
   assert.ok(clients);
   assert.end();
});

test('Check state prior initialization.', (assert) => {
   assert.equal(clients.ready, false, 'Clients object is not ready!');
   // assert.throws(() => Clients.broadcast(new Message.Data('init', 'test')), 
   // 'Broadcast prior initialization should throw an exception.');
   assert.end();
});

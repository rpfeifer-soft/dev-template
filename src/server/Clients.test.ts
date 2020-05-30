/** @format */

import test from 'tape';
import Clients from './Clients.js';
// import Message from '../shared/Message.js';

// tslint:disable-next-line: no-console
console.log('\x1b[33mStarting tests: Clients\x1b[0m');

test('Need a singleton instance of Clients', (assert) => {
   assert.ok(Clients);
   assert.end();
});

test('Check state prior initialization.', (assert) => {
   assert.equal(Clients.ready, false, 'Clients object is not ready!');
   // assert.throws(() => Clients.broadcast(new Message.Data('init', 'test')), 
   // 'Broadcast prior initialization should throw an exception.');
   assert.end();
});

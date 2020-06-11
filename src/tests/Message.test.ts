/** @format */

import test from 'tape';
import { Void, Bool, Double, Text, Time, IMessageFactory } from '../shared/Message.js';
import MsgInit from '../shared/Messages/Init.js';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: Message\x1b[0m');

function serialize<T>(factory: IMessageFactory<T>, data: T) {
   return factory.unpack(factory.pack().parse(factory.pack(data).stringify()));
}

function assertEqual<T>(assert: test.Test, factory: IMessageFactory<T>, value: T, expected?: T) {
   assert.equal(serialize(factory, value), expected || value);
}

function assertDeepEqual<T>(assert: test.Test, factory: IMessageFactory<T>, value: T, expected?: T) {
   assert.deepEqual(serialize(factory, value), expected || value);
}

test('Check default factories', (assert) => {
   assert.ok(Void);
   assert.ok(Bool);
   assert.ok(Text);
   assert.ok(Double);
   assert.ok(Time);
   assert.end();
});

test('Create boolean data message', (assert) => {
   let msg = Bool.pack(true);
   assert.equal(Bool.unpack(msg), true);
   msg = Bool.pack(false);
   assert.equal(Bool.unpack(msg), false);
   assert.end();
});

test('Serialize boolean data message', (assert) => {
   let ensure = (value?: boolean) => assertEqual(assert, Bool, value);
   ensure(undefined);
   ensure(true);
   ensure(false);
   assert.end();
});

test('Create string data message', (assert) => {
   let msg = Text.pack('text');
   assert.equal(Text.unpack(msg), 'text');
   msg = Text.pack();
   assert.equal(Text.unpack(msg), undefined);
   msg = Text.pack('');
   assert.equal(Text.unpack(msg), '');
   assert.end();
});

test('Serialize string data message', (assert) => {
   let ensure = (value?: string, expected?: string) => assertEqual(assert, Text, value, expected);
   ensure(undefined);
   ensure('');
   ensure('text');
   assert.end();
});

test('Create number data message', (assert) => {
   let msg = Double.pack(21);
   assert.equal(Double.unpack(msg), 21);
   msg = Double.pack();
   assert.equal(Double.unpack(msg), undefined);
   msg = Double.pack(-19.78);
   assert.equal(Double.unpack(msg), -19.78);
   msg = Double.pack(0);
   assert.equal(Double.unpack(msg), 0);
   assert.end();
});

test('Serialize number data message', (assert) => {
   let ensure = (value?: number, expected?: number) => assertEqual(assert, Double, value, expected);
   ensure(undefined);
   ensure(21);
   ensure(-19.78);
   ensure(0);
   assert.end();
});

test('Create date data message', (assert) => {
   let now = new Date();
   let msg = Time.pack(now);
   let msg2 = Time.unpack(msg);
   assert.ok(msg2);
   if (msg2) {
      assert.equal(msg2.valueOf(), now.valueOf());
   }
   assert.end();
});

test('Serialize date data message', (assert) => {
   let cmpDate = (date?: Date) => date ? date.valueOf() : undefined;
   let now = new Date();
   let then = new Date(1978, 9, 21, 19, 7, 8, 21);
   assert.equal(cmpDate(serialize(Time, undefined)), cmpDate(undefined));
   assert.equal(cmpDate(serialize(Time, now)), cmpDate(now));
   assert.equal(cmpDate(serialize(Time, then)), cmpDate(then));
   assert.end();
});

test('Serialize JSON data', (assert) => {
   let ensure = (value?: MsgInit, expected?: MsgInit) => assertDeepEqual(assert, MsgInit.Msg, value, expected);
   let now = new Date(Date.now());
   let init = {
      browser: 'Browser',
      url: 'url',
      time: now
   };
   ensure(undefined);
   ensure(init);
   ensure({
      browser: 'Browser',
      url: 'url',
      time: now,
      test: undefined
   }, init);
   assert.end();
});

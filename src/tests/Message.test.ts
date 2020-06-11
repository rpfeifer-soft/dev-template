/** @format */

import test from 'tape';
import { Bool, Double, Text, Time, IMessageFactory } from '../shared/Message.js';
import MsgInit from '../shared/Messages/MsgInit.js';

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

test('Check default classes', (assert) => {
   assert.ok(Bool);
   assert.ok(Text);
   assert.ok(Double);
   assert.ok(Time);
   assert.end();
});

test('Create boolean data message', (assert) => {
   let msg = new Bool(true);
   assert.equal(msg.data, true);
   msg = new Bool(false);
   assert.equal(msg.data, false);
   assert.end();
});

test('Serialize boolean data message', (assert) => {
   let ensure = (value?: boolean) => assertEqual(assert, Bool.Msg, value);
   ensure(undefined);
   ensure(true);
   ensure(false);
   assert.end();
});

test('Create string data message', (assert) => {
   let msg = new Text('text');
   assert.equal(msg.data, 'text');
   msg = new Text();
   assert.equal(msg.data, undefined);
   msg = new Text('');
   assert.equal(msg.data, '');
   assert.end();
});

test('Serialize string data message', (assert) => {
   let ensure = (value?: string, expected?: string) => assertEqual(assert, Text.Msg, value, expected);
   ensure(undefined);
   ensure('');
   ensure('text');
   assert.end();
});

test('Create number data message', (assert) => {
   let msg = new Double(21);
   assert.equal(msg.data, 21);
   msg = new Double();
   assert.equal(msg.data, undefined);
   msg = new Double(-19.78);
   assert.equal(msg.data, -19.78);
   msg = new Double(0);
   assert.equal(msg.data, 0);
   assert.end();
});

test('Serialize number data message', (assert) => {
   let ensure = (value?: number, expected?: number) => assertEqual(assert, Double.Msg, value, expected);
   ensure(undefined);
   ensure(21);
   ensure(-19.78);
   ensure(0);
   assert.end();
});

test('Create date data message', (assert) => {
   let now = new Date();
   let msg = new Time(now);
   assert.ok(msg.data);
   if (msg.data) {
      assert.equal(msg.data.valueOf(), now.valueOf());
   }

   msg = new Time();
   assert.equal(msg.data, undefined);

   let date = new Date(1978, 9, 21, 19, 7, 8, 21);
   msg = new Time(date);
   assert.ok(msg.data);
   if (msg.data) {
      assert.equal(msg.data.valueOf(), date.valueOf());
   }

   date.setHours(0, 0, 0, 0);
   if (msg.data) {
      assert.notEqual(msg.data.valueOf(), date.valueOf());
   }
   assert.end();
});

test('Serialize date data message', (assert) => {
   let cmpDate = (date?: Date) => date ? date.valueOf() : undefined;
   let now = new Date();
   let then = new Date(1978, 9, 21, 19, 7, 8, 21);
   assert.equal(cmpDate(serialize(Time.Msg, undefined)), cmpDate(undefined));
   assert.equal(cmpDate(serialize(Time.Msg, now)), cmpDate(now));
   assert.equal(cmpDate(serialize(Time.Msg, then)), cmpDate(then));
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

/** @format */

import test from 'tape';
import { Bool, Double, Text, Time } from '../shared/Message.js';
import MsgInit from '../shared/Messages/MsgInit.js';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: Message\x1b[0m');

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
   let msgOrig = new Bool(true);
   let msg = Bool.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Bool(false);
   msg = Bool.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);
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
   let msgOrig = new Text('text');
   let msg = Text.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Text();
   msg = Text.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Text('');
   msg = Text.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);
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
   let msgOrig = new Double(21);
   let msg = Double.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Double();
   msg = Double.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Double(-19.78);
   msg = Double.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Double(0);
   msg = Double.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);
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
   let msgOrig = new Time(new Date());
   let msg = Time.parse(msgOrig.stringify());
   assert.ok(msg.data);
   assert.ok(msgOrig.data);
   if (msg.data && msgOrig.data) {
      assert.equal(msg.data.valueOf(), msgOrig.data.valueOf());
   }

   msgOrig = new Time();
   msg = Time.parse(msgOrig.stringify());
   assert.notok(msg.data);
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Time(new Date(1978, 9, 21, 19, 7, 8, 21));
   msg = Time.parse(msgOrig.stringify());
   assert.ok(msg.data);
   assert.ok(msgOrig.data);
   if (msg.data && msgOrig.data) {
      assert.equal(msg.data.valueOf(), msgOrig.data.valueOf());
   }
   assert.end();
});

test('Serialize JSON data', (assert) => {
   let msgOrig = new MsgInit();
   msgOrig.browser = 'Browser';
   msgOrig.url = 'url';
   msgOrig.time = new Date(Date.now());

   let msg = MsgInit.parse(msgOrig.stringify());
   assert.equals(msg.browser, msgOrig.browser);
   assert.equals(msg.url, msgOrig.url);
   if (msg.time && msgOrig.time) {
      assert.equals(msg.time.valueOf(), msgOrig.time.valueOf());
   } else {
      assert.notok(msg.time);
      assert.notok(msgOrig.time);
   }
   assert.end();
});

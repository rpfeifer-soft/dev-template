/** @format */

import test from 'tape';
import Message from './Message.js';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: Message\x1b[0m');

test('Check default classes', (assert) => {
   assert.ok(Message.Boolean);
   assert.ok(Message.String);
   assert.ok(Message.Number);
   assert.ok(Message.Time);
   assert.end();
});

test('Create boolean data message', (assert) => {
   let msg = new Message.Boolean(true);
   assert.equal(msg.data, true);
   msg = new Message.Boolean(false);
   assert.equal(msg.data, false);
   assert.end();
});

test('Serialize boolean data message', (assert) => {
   let msgOrig = new Message.Boolean(true);
   let msg = Message.Boolean.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Message.Boolean(false);
   msg = Message.Boolean.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);
   assert.end();
});

test('Create string data message', (assert) => {
   let msg = new Message.String('text');
   assert.equal(msg.data, 'text');
   msg = new Message.String();
   assert.equal(msg.data, undefined);
   msg = new Message.String('');
   assert.equal(msg.data, '');
   assert.end();
});

test('Serialize string data message', (assert) => {
   let msgOrig = new Message.String('text');
   let msg = Message.String.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Message.String();
   msg = Message.String.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Message.String('');
   msg = Message.String.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);
   assert.end();
});

test('Create number data message', (assert) => {
   let msg = new Message.Number(21);
   assert.equal(msg.data, 21);
   msg = new Message.Number();
   assert.equal(msg.data, undefined);
   msg = new Message.Number(-19.78);
   assert.equal(msg.data, -19.78);
   assert.end();
});

test('Serialize number data message', (assert) => {
   let msgOrig = new Message.Number(21);
   let msg = Message.Number.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Message.Number();
   msg = Message.Number.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Message.Number(-19.78);
   msg = Message.Number.parse(msgOrig.stringify());
   assert.equal(msg.data, msgOrig.data);
   assert.end();
});

test('Create date data message', (assert) => {
   let now = new Date();
   let msg = new Message.Time(now);
   assert.ok(msg.data);
   if (msg.data) {
      assert.equal(msg.data.valueOf(), now.valueOf());
   }

   msg = new Message.Time();
   assert.equal(msg.data, undefined);

   let date = new Date(1978, 9, 21, 19, 7, 8, 21);
   msg = new Message.Time(date);
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
   let msgOrig = new Message.Time(new Date());
   let msg = Message.Time.parse(msgOrig.stringify());
   assert.ok(msg.data);
   assert.ok(msgOrig.data);
   if (msg.data && msgOrig.data) {
      assert.equal(msg.data.valueOf(), msgOrig.data.valueOf());
   }

   msgOrig = new Message.Time();
   msg = Message.Time.parse(msgOrig.stringify());
   assert.notok(msg.data);
   assert.equal(msg.data, msgOrig.data);

   msgOrig = new Message.Time(new Date(1978, 9, 21, 19, 7, 8, 21));
   msg = Message.Time.parse(msgOrig.stringify());
   assert.ok(msg.data);
   assert.ok(msgOrig.data);
   if (msg.data && msgOrig.data) {
      assert.equal(msg.data.valueOf(), msgOrig.data.valueOf());
   }
   assert.end();
});

/*
interface TestMessage {
   testNumber: number;
   testBool: boolean;
}
class TestMessage extends Message {

   static parseResult(result: Message.IMessageResult) {
      let json: TestMessage = JSON.parse(result.data);
      let msg = new TestMessage(result);
      return msg;
   }

   constructor(msg?: Message) {
      super('Test', msg);
   }

   stringifyData() {
      return JSON.stringify({
         testNumber: this.testNumber,
         testBool: this.testBool
      });
   }
}
type ITestMessage = Pick<TestMessage, keyof TestMessage>;

test('Send a message and return string', (assert) => {
   setTimeout(() => {
      handleAnswer(1, 'result', '');
   }, 2000);
   assert.plan(3);
   assert.pass('Sending the message!');
   send<string>(new Message.Data('test', 'data'))
      .then(result => assert.equal(result, 'result', 'compare the returning string.'));
   assert.pass('Result arrived?');
});
*/
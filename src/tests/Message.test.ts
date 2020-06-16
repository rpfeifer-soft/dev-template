/** @format */

import test from 'tape';
import Message from '../shared/serialize/Message.js';
import { fVoid, fBool, fDate, fNumber, fString } from '../shared/serialize/serialize.js';
import ByteArray from '../shared/ByteArray.js';
import { createJsonFactory, jsonDateSerializer } from '../shared/serialize/createJsonFactory.js';
import createBinaryFactory from '../shared/serialize/BinaryFactory.js';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: Message\x1b[0m');

function serialize<T>(factory: Message.IMessageFactory<T>, data: T) {
   return factory.unpack(factory.pack().parse(factory.pack(data).stringify()));
}

function assertEqual<T>(assert: test.Test, factory: Message.IMessageFactory<T>, value: T, expected?: T) {
   assert.equal(serialize(factory, value), expected || value);
}

function assertDeepEqual<T>(assert: test.Test, factory: Message.IMessageFactory<T>, value: T, expected?: T) {
   assert.deepEqual(serialize(factory, value), expected || value);
}

test('Check default factories', (assert) => {
   assert.ok(fVoid);
   assert.ok(fBool);
   assert.ok(fString);
   assert.ok(fNumber);
   assert.ok(fDate);
   assert.end();
});

test('Create boolean data message', (assert) => {
   let msg = fBool.pack(true);
   assert.equal(fBool.unpack(msg), true);
   msg = fBool.pack(false);
   assert.equal(fBool.unpack(msg), false);
   assert.end();
});

test('Serialize boolean data message', (assert) => {
   let ensure = (value?: boolean) => assertEqual(assert, fBool, value);
   ensure(undefined);
   ensure(true);
   ensure(false);
   assert.end();
});

test('Create string data message', (assert) => {
   let msg = fString.pack('text');
   assert.equal(fString.unpack(msg), 'text');
   msg = fString.pack();
   assert.equal(fString.unpack(msg), undefined);
   msg = fString.pack('');
   assert.equal(fString.unpack(msg), '');
   assert.end();
});

test('Serialize string data message', (assert) => {
   let ensure = (value?: string, expected?: string) => assertEqual(assert, fString, value, expected);
   ensure(undefined);
   ensure('');
   ensure('text');
   assert.end();
});

test('Create number data message', (assert) => {
   let msg = fNumber.pack(21);
   assert.equal(fNumber.unpack(msg), 21);
   msg = fNumber.pack();
   assert.equal(fNumber.unpack(msg), undefined);
   msg = fNumber.pack(-19.78);
   assert.equal(fNumber.unpack(msg), -19.78);
   msg = fNumber.pack(0);
   assert.equal(fNumber.unpack(msg), 0);
   assert.end();
});

test('Serialize number data message', (assert) => {
   let ensure = (value?: number, expected?: number) => assertEqual(assert, fNumber, value, expected);
   ensure(undefined);
   ensure(21);
   ensure(-19.78);
   ensure(0);
   assert.end();
});

test('Create date data message', (assert) => {
   let now = new Date();
   let msg = fDate.pack(now);
   let msg2 = fDate.unpack(msg);
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
   assert.equal(cmpDate(serialize(fDate, undefined)), cmpDate(undefined));
   assert.equal(cmpDate(serialize(fDate, now)), cmpDate(now));
   assert.equal(cmpDate(serialize(fDate, then)), cmpDate(then));
   assert.end();
});


/* Test Json object with and without binary serialization */
interface IInit {
   url: string;
   browser?: string;
   time?: Date;
   test?: string;
}

interface Init extends IInit { };
class Init {
   constructor(url: string = '', browser?: string, time?: Date) {
      this.url = url;
      this.browser = browser || '';
      this.time = time;
   }

   dump() {
      // eslint-disable-next-line no-console
      console.log(this.time, this.browser);
   }
};

const jInit = createJsonFactory<Init, IInit>(() => new Init(), {
   url: true,
   browser: true,
   time: jsonDateSerializer,
   test: true
});

const fInit = createBinaryFactory<Init>(() => new Init(),
   (bytes, data, opt) => {
      data.url = bytes.getString() || '';
      data.browser = bytes.getString(); opt('browser');
      data.time = bytes.getDate();
      data.test = bytes.getString(); opt('test');
   },
   (data: Init, bytes: ByteArray) => {
      bytes.addString(data.url);
      bytes.addString(data.browser);
      bytes.addDate(data.time);
      bytes.addString(data.test);
   });

function testObject(assert: test.Test, factory: Message.IMessageFactory<Init>) {
   let ensure = (value?: Init, expected?: Init) => assertDeepEqual(assert, factory, value, expected);
   let now = new Date(Date.now());
   let init = new Init('url', 'Browser', now);
   let extended = new Init('url', 'Browser', now);
   extended.test = undefined;
   ensure(undefined);
   ensure(init);
   ensure(extended, init);
   let out = serialize(factory, init);
   if (out) {
      assert.notEqual(out, init);
      assert.equals(typeof (out.dump), 'function');
      assert.equal(out.dump, init.dump);
   };
   assert.end();
}

test('Serialize object data (JSON)', (assert) => {
   testObject(assert, jInit);
});

test('Serialize object data (Binary)', (assert) => {
   testObject(assert, fInit);
});

function testObjects(assert: test.Test, factory: Message.IMessageFactory<Init[]>) {
   let ensure = (value?: Init[], expected?: Init[]) => assertDeepEqual(assert, factory, value, expected);
   let now = new Date(Date.now());
   let init = [
      new Init('url', 'Browser', now),
      new Init('2.', 'anything', undefined),
   ];
   ensure(undefined);
   ensure([]);
   ensure(init);
   let out = serialize(factory, init);
   if (out) {
      assert.notEqual(out, init);
      assert.equals(out.length, init.length);
   };
   assert.end();
}

test('Serialize objects data (Json)', (assert) => {
   testObjects(assert, jInit.array);
});

test('Serialize objects data (Binary)', (assert) => {
   testObjects(assert, fInit.array);
});

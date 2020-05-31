/** @format */

import test from 'tape';
import ByteArray from './ByteArray.js';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: ByteArray\x1b[0m');

function testBoolean(value: boolean | undefined) {
   test('Test boolean (' + value + ')', (assert) => {
      let bytes = new ByteArray();
      let src = value;
      bytes.addBoolean(src);
      let buffer = bytes.getArrayBuffer();
      assert.equals(buffer.byteLength, 1);

      let other = new ByteArray(buffer);
      let dest = other.getBoolean();
      assert.equals(dest, src);
      assert.end();
   });
}
testBoolean(true);
testBoolean(false);
testBoolean(undefined);

function testUint8(value: number, expected?: number) {
   test('Test uint8 (' + value + ')', (assert) => {
      let bytes = new ByteArray();
      let src = value;
      bytes.addUint8(src);
      let buffer = bytes.getArrayBuffer();
      assert.equals(buffer.byteLength, 1);

      let other = new ByteArray(buffer);
      let dest = other.getUint8();
      assert.equals(dest, expected === undefined ? src : expected);
      assert.end();
   });
}
testUint8(0);
testUint8(127);
testUint8(128);
testUint8(255);
testUint8(256, 0);
testUint8(-1, 255);
testUint8(-3, 253);

function testUint16(value: number, expected?: number) {
   test('Test uint16 (' + value + ')', (assert) => {
      let bytes = new ByteArray();
      let src = value;
      bytes.addUint16(src);
      let buffer = bytes.getArrayBuffer();
      assert.equals(buffer.byteLength, 2);

      let other = new ByteArray(buffer);
      let dest = other.getUint16();
      assert.equals(dest, expected === undefined ? src : expected);
      assert.end();
   });
}
testUint16(0);
testUint16(255);
testUint16(65535);
testUint16(65536, 0);
testUint16(-1, 65535);

function testUint32(value: number, expected?: number) {
   test('Test uint32 (' + value + ')', (assert) => {
      let bytes = new ByteArray();
      let src = value;
      bytes.addUint32(src);
      let buffer = bytes.getArrayBuffer();
      assert.equals(buffer.byteLength, 4);

      let other = new ByteArray(buffer);
      let dest = other.getUint32();
      assert.equals(dest, expected === undefined ? src : expected);
      assert.end();
   });
}
testUint32(0);
testUint32(255);
testUint32(65535);
testUint32(65536);
testUint32(0xffffffff);
testUint32(-1, 0xffffffff);

function testNumber(value: number | undefined, expected?: number) {
   test('Test number (' + value + ')', (assert) => {
      let bytes = new ByteArray();
      let src = value;
      bytes.addNumber(src);
      let buffer = bytes.getArrayBuffer();
      assert.equals(buffer.byteLength, 8);

      let other = new ByteArray(buffer);
      let dest = other.getNumber();
      assert.equals(dest, expected === undefined ? src : expected);
      assert.end();
   });
}
testNumber(0);
testNumber(19.78);
testNumber(-2110.78);
testNumber(Math.PI);
testNumber(undefined);
testNumber(Number.MAX_VALUE);
testNumber(Number.MIN_VALUE);
testNumber(Number.MAX_SAFE_INTEGER);
testNumber(Number.MIN_SAFE_INTEGER);

function testString(value: string | undefined, len: number, expected?: string) {
   test('Test string (' + (value === undefined ? 'undefined' : value.substr(0, 35)) + ')', (assert) => {
      let bytes = new ByteArray();
      let src = value;
      bytes.addString(src);
      let buffer = bytes.getArrayBuffer();
      assert.equals(buffer.byteLength, len);

      let other = new ByteArray(buffer);
      let dest = other.getString();
      assert.equals(dest, expected === undefined ? src : expected);
      assert.end();
   });
}
testString('Test', 5);
testString('', 1);
testString(undefined, 1);
testString('Das ist ein laengerer Test', 'Das ist ein laengerer Test'.length + 1);
testString(new Array(126 + 1).join('.'), 127);
testString(new Array(127 + 1).join('.'), 131);
testString(new Array(128 + 1).join(':'), 132);
testString(new Array(32800 + 1).join('>'), 32804);

function testObject(values: (number | string | boolean)[]) {
   test('Test string (' + values + ')', (assert) => {
      let bytes = new ByteArray();
      values.forEach(value => {
         if (typeof (value) === 'string') {
            bytes.addString(value);
         } else if (typeof (value) === 'number') {
            bytes.addNumber(value);
         } else if (typeof (value) === 'boolean') {
            bytes.addBoolean(value);
         }
      });
      let buffer = bytes.getArrayBuffer();

      let other = new ByteArray(buffer);
      values.forEach(value => {
         if (typeof (value) === 'string') {
            assert.equals(other.getString(), value);
         } else if (typeof (value) === 'number') {
            assert.equals(other.getNumber(), value);
         } else if (typeof (value) === 'boolean') {
            assert.equals(other.getBoolean(), value);
         }
      });
      assert.end();
   });
}
testObject([5, 'Test', false]);
testObject([5, new Array(128 + 1).join('.'), false]);
testObject(['', 5.5, true]);

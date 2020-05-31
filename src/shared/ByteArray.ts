/** @format */
/* eslint-disable no-bitwise */

import TextEncoder from './TextEncoder.js';
import TextDecoder from './TextDecoder.js';

class ByteArray {
   private size = 0;
   private arrays: Uint8Array[] = [];

   private read: Uint8Array;
   private readDataView: DataView;
   private offset: number;

   constructor(buffer?: ArrayBuffer) {
      if (buffer) {
         this.read = new Uint8Array(buffer);
         this.readDataView = new DataView(buffer);
         this.offset = 0;
      }
   }

   public getArrayBuffer(): ArrayBuffer {
      let buffer = new Uint8Array(this.size);
      let offset = 0;
      this.arrays.forEach(p => {
         buffer.set(p, offset);
         offset += p.length;
      });
      // Flatten the array
      this.arrays = [buffer];
      this.size = buffer.length;
      return buffer.buffer;
   }

   public addUint8(byte: number) {
      this.arrays.push(new Uint8Array([byte]));
      this.size++;
      return this;
   }

   public getUint8(): number {
      let value = this.read[this.offset];
      this.offset++;
      return value;
   }

   public addUint16(word: number) {
      this.arrays.push(new Uint8Array([(word >> 8) & 0xff, word & 0xff]));
      this.size += 2;
      return this;
   }

   public getUint16(): number {
      let value = (this.read[this.offset] << 8) + this.read[this.offset + 1];
      this.offset += 2;
      return value;
   }

   public addUint32(word: number) {
      this.arrays.push(new Uint8Array([
         (word >> 24) & 0xff, (word >> 16) & 0xff, (word >> 8) & 0xff, word & 0xff]));
      this.size += 4;
      return this;
   }

   public getUint32(): number {
      let value =
         (this.read[this.offset] << 24) + (this.read[this.offset + 1] << 16) +
         (this.read[this.offset + 2] << 8) + this.read[this.offset + 3];
      this.offset += 4;
      return value >>> 0;
   }

   public addNumber(value: number | undefined) {
      let buffer = new Uint8Array(8);
      let view = new DataView(buffer.buffer);
      view.setFloat64(0, value === undefined ? NaN : value);
      this.arrays.push(buffer);
      this.size += 8;
      return this;
   }

   public getNumber(): number | undefined {
      let value = this.readDataView.getFloat64(this.offset);
      this.offset += 8;
      return isNaN(value) ? undefined : value;
   }

   public addString(value: string | undefined) {
      let encoder = new TextEncoder();
      if (value === undefined) {
         // 127 is undefined
         this.addUint8(0x7f);
         return this;
      }
      let buffer = encoder.encode(value);
      if (buffer.length >= 127) {
         this.addUint32(0x80000000 | (buffer.length & 0x3fffffff));
      } else {
         this.addUint8(buffer.length);
      }
      this.arrays.push(buffer);
      this.size += buffer.length;
      return this;
   }

   public getString(): string | undefined {
      let length = this.read[this.offset];
      if (length === 0x7f) {
         this.offset++;
         return undefined;
      }
      if (length & 0x80) {
         // long string
         length = this.getUint32() & 0x3fffffff;
      } else {
         this.offset++;
      }
      let decoder = new TextDecoder();
      let value = decoder.decode(this.read.slice(this.offset, this.offset + length));
      this.offset += length;
      return value;
   }

   public addBoolean(value: boolean | undefined) {
      this.addUint8(value === undefined ? 2 : (value ? 1 : 0));
      return this;
   }

   public getBoolean(): boolean | undefined {
      let value = this.getUint8();
      return value === 2 ? undefined : (value ? true : false);
   }
}

export default ByteArray;
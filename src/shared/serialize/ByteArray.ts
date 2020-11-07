/** @format */
/* eslint-disable no-bitwise */

import TextEncoder from './TextEncoder.js';
import TextDecoder from './TextDecoder.js';

export class ByteArray {
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
      const buffer = new Uint8Array(this.size);
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

   public addBuffer(buffer: ArrayBuffer): this {
      const array = new Uint8Array(buffer);
      this.arrays.push(array);
      this.size += array.length;
      return this;
   }

   public addUint8(byte: number): this {
      this.arrays.push(new Uint8Array([byte]));
      this.size++;
      return this;
   }

   public getUint8(): number {
      const value = this.read[this.offset];
      this.offset++;
      return value;
   }

   public addUint16(word: number): this {
      this.arrays.push(new Uint8Array([(word >> 8) & 0xFF, word & 0xFF]));
      this.size += 2;
      return this;
   }

   public getUint16(): number {
      const value = (this.read[this.offset] << 8) + this.read[this.offset + 1];
      this.offset += 2;
      return value;
   }

   public addUint32(word: number): this {
      this.arrays.push(new Uint8Array([
         (word >> 24) & 0xFF, (word >> 16) & 0xFF, (word >> 8) & 0xFF, word & 0xFF]));
      this.size += 4;
      return this;
   }

   public getUint32(): number {
      const value =
         (this.read[this.offset] << 24) + (this.read[this.offset + 1] << 16) +
         (this.read[this.offset + 2] << 8) + this.read[this.offset + 3];
      this.offset += 4;
      return value >>> 0;
   }

   public addNumber(value: number | undefined): this {
      const buffer = new Uint8Array(8);
      const view = new DataView(buffer.buffer);
      view.setFloat64(0, value === undefined ? Number.NaN : value);
      this.arrays.push(buffer);
      this.size += 8;
      return this;
   }

   public getNumber(): number | undefined {
      const value = this.readDataView.getFloat64(this.offset);
      this.offset += 8;
      return Number.isNaN(value) ? undefined : value;
   }

   public addDate(value: Date | undefined): this {
      const time = value ? value.valueOf() : undefined;
      this.addNumber(time);
      return this;
   }

   public getDate(): Date | undefined {
      const time = this.getNumber();
      return time === undefined ? undefined : new Date(time);
   }

   public addString(value: string | undefined): this {
      const encoder = new TextEncoder();
      if (value === undefined) {
         // 127 is undefined
         this.addUint8(0x7F);
         return this;
      }
      const buffer = encoder.encode(value);
      if (buffer.length >= 127) {
         this.addUint32(0x80000000 | (buffer.length & 0x3FFFFFFF));
      } else {
         this.addUint8(buffer.length);
      }
      this.arrays.push(buffer);
      this.size += buffer.length;
      return this;
   }

   public getString(): string | undefined {
      let length = this.read[this.offset];
      if (length === 0x7F) {
         this.offset++;
         return undefined;
      }
      if (length & 0x80) {
         // long string
         length = this.getUint32() & 0x3FFFFFFF;
      } else {
         this.offset++;
      }
      const decoder = new TextDecoder();
      const value = decoder.decode(this.read.slice(this.offset, this.offset + length));
      this.offset += length;
      return value;
   }

   public addBoolean(value: boolean | undefined): this {
      this.addUint8(value === undefined ? 2 : (value ? 1 : 0));
      return this;
   }

   public getBoolean(): boolean | undefined {
      const value = this.getUint8();
      return value === 2 ? undefined : (value ? true : false);
   }

   public addArray<T>(
      array: T[] | undefined,
      add: (item: T) => void
   ): this {
      if (array === undefined) {
         this.addNumber(undefined);
      } else {
         const count = array.length;
         this.addNumber(count);
         for (let index = 0; index < count; index++) {
            add(array[index]);
         }
      }
      return this;
   }

   public getArray<T>(
      get: () => T | undefined
   ): T[] | undefined {
      const count = this.getNumber();
      if (count === undefined) {
         return undefined;
      }
      const array: T[] = [];
      for (let index = 0; index < count; index++) {
         const item = get();
         if (item !== undefined) {
            array.push(item);
         }
      }
      return array;
   }
}

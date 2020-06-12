/** @format */

import Message from './Message.js';

type Schema<TClass, TInterface> = [
   (new () => TClass),
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   Record<keyof TInterface, boolean | ((write: boolean, value: any) => any)>
];

// Special data implementation
class Json<TClass, TInterface> extends Message {
   data?: TClass;

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   schema: Schema<TClass, TInterface>;

   constructor(schema: Schema<TClass, TInterface>, data?: TClass) {
      super();
      // Set the values (no copy)
      this.data = data;
      this.schema = schema;
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   static dateSerializer(write: boolean, value: any) {
      if (write) {
         return value !== undefined ? value.getTime() : undefined;
      } else {
         return value !== undefined ? new Date(value) : undefined;
      }
   }

   parse(data: string | ArrayBuffer) {
      if (typeof (data) !== 'string') {
         throw new Error('ArrayBuffer not support for generic data!');
      }
      let json = Message.fromJSON(data);
      if (json === undefined) {
         this.data = undefined;
      } else {
         let entries = Object.entries(this.schema[1]);
         if (!this.data) {
            this.data = new this.schema[0];
         }
         let object = this.data;
         let assign = (key: string, value: unknown) => {
            if (value !== undefined) {
               object[key] = value;
            }
         };
         entries.forEach(([key, value]) => {
            if (value === true) {
               // Copy as is
               assign(key, json[key]);
            }
            if (typeof value === 'function') {
               assign(key, value(false, json[key]));
            }
         });
      }
      return this;
   }

   stringify(): string | ArrayBuffer {
      let json = {};
      let entries = Object.entries(this.schema[1]);
      if (this.data) {
         let object = this.data;
         let assign = (key: string, value: unknown) => {
            if (value !== undefined) {
               json[key] = value;
            }
         };
         entries.forEach(([key, value]) => {
            if (value === true) {
               // Copy as is
               assign(key, object[key]);
            }
            if (typeof value === 'function') {
               assign(key, value(true, object[key]));
            }
         });
      }
      return Message.toJSON(this.data === undefined ? undefined : json);
   }
}

export default Json;
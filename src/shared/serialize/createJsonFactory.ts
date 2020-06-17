/** @format */

import { Message, IMessagesFactory, IMessageFactory, fromJSON, toJSON } from './Message.js';

type Schema<TClass, TInterface> = [
   () => TClass,
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

   parse(data: string | ArrayBuffer) {
      if (typeof (data) !== 'string') {
         throw new Error('ArrayBuffer not support for generic data!');
      }
      const json = fromJSON(data);
      if (json === undefined) {
         this.data = undefined;
      } else {
         const entries = Object.entries(this.schema[1]);
         if (!this.data) {
            this.data = this.schema[0]();
         }
         const object = this.data;
         const assign = (key: string, value: unknown) => {
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
      const json = {};
      const entries = Object.entries(this.schema[1]);
      if (this.data) {
         const object = this.data;
         const assign = (key: string, value: unknown) => {
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
      return toJSON(this.data === undefined ? undefined : json);
   }
}

// Support array
class JsonArrayClass<TClass> extends Message {
   data?: TClass[];

   factory: IMessageFactory<TClass>;

   constructor(
      factory: IMessageFactory<TClass>,
      data?: TClass[]
   ) {
      super();

      this.factory = factory;
      this.data = data;
   }

   parse(data: string | ArrayBuffer) {
      if (typeof (data) !== 'string') {
         throw new Error('ArrayBuffer not support for generic data!');
      }
      const jsonArray = fromJSON(data) as string[];
      if (jsonArray === undefined) {
         this.data = undefined;
      } else {
         this.data = [];
         const items = this.data;
         jsonArray.forEach((json) => {
            const msg = this.factory.pack();
            msg.parse(json);
            const item = this.factory.unpack(msg);
            if (item !== undefined) {
               items.push(item);
            }
         });
      }
      return this;
   }

   stringify() {
      if (this.data === undefined) {
         return toJSON(this.data);
      }
      const jsonArray = this.data.map((item) => {
         const msg = this.factory.pack(item);
         const json = msg.stringify();
         if (typeof (json) !== 'string') {
            throw new Error('Unsupported serialization type: Json expected!');
         }
         return json;
      });
      return toJSON(jsonArray);
   }
}

export function createJsonFactory<TClass, TInterface>(
   ctor: () => TClass,
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   schema: Record<keyof TInterface, boolean | ((write: boolean, value: any) => any)>
): IMessagesFactory<TClass> {
   const factory: IMessagesFactory<TClass> = {
      pack: (value) => new Json<TClass, TInterface>([ctor, schema], value),
      unpack: (msg: Json<TClass, TInterface>) => msg.data,
      array: {
         pack: (value) => new JsonArrayClass<TClass>(factory, value),
         unpack: (msg: JsonArrayClass<TClass>) => msg.data
      }
   };
   return factory;
}

// Toolfunctions

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function jsonDateSerializer(
   write: boolean,
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   value: any): any {
   if (write) {
      return value !== undefined ? value.getTime() : undefined;
   } else {
      return value !== undefined ? new Date(value) : undefined;
   }
}
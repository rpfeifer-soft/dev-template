/** @format */

import { Message, IMessagesFactory, IMessageFactory, fromJSON, toJSON } from './Message.js';

export interface IJsonObject {
   type: string;
}

type Schema<TClass, TInterface> = [
   () => TClass,
   Record<keyof TInterface, boolean | ((write: boolean, value: unknown) => unknown)>
];

// Special data implementation
class Json<TClass extends IJsonObject, TInterface> extends Message {
   data?: TClass;

   schema: Schema<TClass, TInterface>;

   constructor(schema: Schema<TClass, TInterface>, data?: TClass) {
      super();
      // Set the values (no copy)
      this.data = data;
      this.schema = schema;
   }

   parse(data: string | ArrayBuffer) {
      if (typeof (data) !== 'string') {
         throw new TypeError('ArrayBuffer not support for generic data!');
      }
      const json = fromJSON(data) as IJsonObject | undefined;
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
         throw new TypeError('ArrayBuffer not support for generic data!');
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
            throw new TypeError('Unsupported serialization type: Json expected!');
         }
         return json;
      });
      return toJSON(jsonArray);
   }
}

export function createJsonFactory<TClass extends IJsonObject, TInterface>(
   ctor: () => TClass,
   schema: Record<keyof TInterface, boolean | ((write: boolean, value: unknown) => unknown)>
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
export function jsonDateSerializer(write: boolean, value: unknown): unknown {
   if (write) {
      const date = value as Date;
      return date !== undefined ? date.getTime() : undefined;
   } else {
      const time = value as number;
      return time !== undefined ? new Date(time) : undefined;
   }
}
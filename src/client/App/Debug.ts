/** @format */

export default function registerDebug(key: string, handler: () => unknown) {
   // eslint-disable-next-line @typescript-eslint/dot-notation
   if (!window['isProduction']) {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      window[key] = handler;
   }
}
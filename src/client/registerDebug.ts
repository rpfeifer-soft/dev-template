/** @format */

export function registerDebug(key: string, handler: () => unknown): void {
   // eslint-disable-next-line @typescript-eslint/dot-notation
   if (!window['isProduction']) {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      window[key] = handler;

      const app = document.getElementById('app');
      if (app) {
         const node = document.createElement('button');
         node.textContent = key;
         node.onclick = () => {
            // eslint-disable-next-line no-console
            console.log(handler());
         };
         app.appendChild(node);
      }
   } else {  // Allow access to the object in production
      window[key] = handler();
   }
}
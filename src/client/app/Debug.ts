/** @format */

export function registerDebug(key: string, handler: () => unknown) {
   // eslint-disable-next-line @typescript-eslint/dot-notation
   if (!window['isProduction']) {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      window[key] = handler;

      let app = document.getElementById('app');
      if (app) {
         let node = document.createElement('button');
         node.innerText = key;
         node.onclick = () => {
            // eslint-disable-next-line no-console
            console.log(handler());
         };
         app.appendChild(node);
      }
   }
}
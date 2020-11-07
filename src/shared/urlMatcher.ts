/** @format */

import P2R from 'path-to-regexp';

class UrlMatcher {
   // Ensure an empty instance
   private static Empty: UrlMatcher = UrlMatcher.createEmpty();

   // The url to work with
   private url: string | false;

   // Constructor
   constructor(url: string) {
      if (!url) {
         throw new Error('Internal error: Url mandatory!');
      }
      this.url = url;
   }

   // Private matcher construction
   private static createEmpty(): UrlMatcher {
      const urlMatcher = new UrlMatcher('---');
      urlMatcher.url = false;
      return urlMatcher;
   }

   // The test function
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   when(path: string, callback: (...params: Array<any>) => unknown): UrlMatcher {
      // Do not continue (empty matcher)
      if (!this.url) {
         return this;
      }

      // Check for a match
      const keys: P2R.Key[] = [];
      const regExp = P2R.pathToRegexp(path, keys);
      const check = P2R.regexpToFunction(regExp, keys);
      const result = check(this.url);
      if (!result) {
         return this;
      }
      return !callback(...keys.map(key => result.params[String(key.name)]))
         ? UrlMatcher.Empty
         : this;
   }
}

export default UrlMatcher;
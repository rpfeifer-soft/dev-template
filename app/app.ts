/** @format */

// read options
import options from './options.js';
import express from 'express';

const app = express();

app.listen(options.getPort(), () => {

   // Handle the requests
   app.get('/', (req, res) => res.send('Hello World!!'));

   // tslint:disable-next-line: no-console
   console.log(`Listening on port ${options.getPort()}`);
});

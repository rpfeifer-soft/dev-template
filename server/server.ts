/** @format */

// read options
import options from './options.js';
import express from 'express';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.get('/', (req, res) => res.send('Hello World!'));

   // tslint:disable-next-line: no-console
   console.log(`Listening on port ${options.getPort()}`);
});

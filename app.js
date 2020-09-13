const http = require('http');

//file imports
const respond = require('./lib/respond.js');

//connect settings
const port = process.env.port || 3000;
const hostname = '127.0.0.1';


// create server
const server = http.createServer(respond);

//listen to requests
server.listen(port, ()=>{
    console.log(`Listenening on port: ${port}`);
});
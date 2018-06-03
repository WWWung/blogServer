const server = require('./server/server.js');
const router = require('./router/router.js');

server.start(router.route);

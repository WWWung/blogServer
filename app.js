const server = require('./server/server.js');
const router = require('./router/router.js');

console.log("路由");
server.start(router.route);

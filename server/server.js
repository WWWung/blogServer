const http = require('http');
const url = require('url');
const config = require('../config/config.js');

exports.start = route => {
  const server = http.createServer((req, res) => {
    const urlInfo = url.parse(req.url, true);
    //  设置允许跨域
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
    //  为了跨域设置cookie
    res.setHeader('Access-Control-Allow-Credentials', true);
    //  根据url传的参数执行函数
    route(req, res, urlInfo);
  })
  const io = require('socket.io')(server);

  server.listen(config.server.port, config.server.host);

  io.on('connection', socket => {
    console.log('安排上了');
    // console.log(io.sockets.sockets);
    // socket.emit('test', {data: '我是服务器发给客户端的'})
    socket.on('my other event', data => {
      console.log(io.sockets.sockets[data.id])
      // socket.emit('test', {data: '我是服务器发给客户端的'})
    })
  })

  console.log('Server running at http:' + config.server.host + ':' + config.server.port);
}

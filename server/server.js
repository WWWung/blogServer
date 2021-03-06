const http = require('http');
const url = require('url');
const config = require('../config/config.js');
const io = require('../io/io.js');

exports.start = route => {
  const server = http.createServer((req, res) => {
    const urlInfo = url.parse(req.url, true);
    //  设置允许跨域
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

    // res.setHeader('Access-Control-Allow-Origin', 'http://www.wwwung.cn');
    //  为了跨域设置cookie
    res.setHeader('Access-Control-Allow-Credentials', true);
    //  根据url传的参数执行函数
    try {
      route(req, res, urlInfo);
    } catch (e) {
      console.log('错误已捕获');
      console.log(e);
    }
  })
  // const io = require('socket.io')(server);

  server.listen(config.server.port, config.server.host);
  io.io(server);

  console.log('Server running at http:' + config.server.host + ':' + config.server.port);
}

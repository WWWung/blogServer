const http = require('http');
const url = require('url');
const config = require('../config/config.js')

exports.start = route => {

  http.createServer((req, res) => {
    const urlInfo = url.parse(req.url, true);
    //  设置允许跨域
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
    //  为了跨域设置cookie
    res.setHeader('Access-Control-Allow-Credentials', true);
    //  根据url传的参数执行函数
    route(req, res, urlInfo);
  }).listen(config.server.port, config.server.host);

  console.log('Server running at http:' + config.server.host + ':' + config.server.port);
}

const http = require('http');
const url = require('url');

// const mysqlUtil = require('./mysqlUtil.js');//关于数据库的操作
// const dataUtil = require('./dataUtil.js');//处理数据格式
const api = require('./api/api.js')

const port = 3000;
const host = '127.0.0.8';

http.createServer((req, res) => {

  //设置允许跨域
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Credentials', true);
  // res.writeHead(200, {
  //   'Content-Type': 'text/json',
  //   // 'Set-Cookie': 'myCookie=test'
  // });

  //处理url里包含的信息
  const urlInfo = url.parse(req.url, true);
  const baseName = urlInfo.query.baseName;
  const reqName = urlInfo.pathname.substring(1);
  console.log(reqName)
  //请求的类型
  const method = req.method.toLowerCase();
  if (method === 'post') {
    if(reqName === 'loginIn'){
      api.loginIn(req, res);
    }
    if(reqName === 'submitArticle'){
      res.writeHead(200, {
        'Content-Type': 'text/json'
      })
      api.insertData(req, res, 'article');
    }
  }else if( method === 'get' ){
    const selectSql = 'SELECT * FROM ' + baseName;
    let data = null;
    api.queryData(req, res, baseName);
  }
}).listen(port, host);
console.log('Server running at http:' + host + ':' + port);

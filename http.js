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
  //请求的类型
  const method = req.method.toLowerCase();

  if(reqName === 'loginIn'){
    api.loginIn(req, res);
  }
  if(reqName === 'submitArticle'){
    res.writeHead(200, {
      'Content-Type': 'text/json'
    })
    api.insertDataToArticle(req, res);
  }
  if(reqName === 'register'){
    api.registerUser(req, res);
  }
  if(reqName === 'isLogin'){
    api.isLogin(req, res);
  }
  if(reqName === 'portrait'){
    api.getPortrait(req, res);
  }
  if(reqName === 'articles'){
    api.queryArticlesData(req, res);
  }
  if(reqName === 'article'){
    console.log(urlInfo.query.id)
    api.getBlogById(req, res, urlInfo.query.id);
  }
  if(reqName.indexOf('imgs') > -1){
    api.returnImg(req, res, reqName);
  }
}).listen(port, host);
console.log('Server running at http:' + host + ':' + port);

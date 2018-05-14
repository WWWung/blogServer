const http = require('http');
const url = require('url');

const mysqlUtil = require('./mysqlUtil.js');//关于数据库的操作
const dataUtil = require('./dataUtil.js');//处理数据格式

const port = 3000;
const host = '127.0.0.8';

http.createServer((req, res) => {
  //设置允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, {'Content-Type': 'text/json'});
  console.log(req.session)
  //处理url里包含的信息
  const baseName = url.parse(req.url, true).query.baseName;
  //请求的类型
  const method = req.method.toLowerCase();
  if (method === 'post') {
    let postData = '';
    req.on('data', (chunk) => {
      postData += chunk;
    })
    req.on('end', () => {
      const data = dataUtil.handleData( postData );
      if (typeof data === 'string') {
        res.end(data);
        return ;
      }
      const selectSql = 'INSERT INTO ' + baseName + '(' + data.keyStr + ') VALUE(' + data.queMarks + ')';
      mysqlUtil.query(selectSql, data.values, () => {
        console.log('数据插入成功');
      })
    })
    res.end();
  }else if( method === 'get' ){
    const selectSql = 'SELECT * FROM ' + baseName;
    let data = null;
    mysqlUtil.query(selectSql, null, (rsl) => {
      data = rsl;
      console.log('数据查询成功');
      res.end(JSON.stringify(data));
    })
  }
}).listen(port, host);
console.log('Server running at http:' + host + ':' + port);

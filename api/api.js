//用户登录—前端发送登录请求—后端保存用户 cookies—页面刷新 —前端判断用户id存在—显示登录状态—用户退出—前端发送退出请求–后端清空用户cookies—页面刷新—前端判断用户id不存在—-显示需要登录的界面

const mysqlUtil = require('../mysqlUtil.js');
const dataUtil = require('../dataUtil.js');
const session = require('../session.js')

//md5加密模块
const crypto = require('crypto');

let api = {
  queryData (req, res, base) {
    const selectSql = 'SELECT * FROM ' + base;
    mysqlUtil.query(selectSql, null, (rsl) => {
      console.log('数据查询成功');
      res.end(JSON.stringify(rsl));
    })
  },
  insertData (req, res, base) {
    let postData = '';
    req.on('data', (chunk) => {
      postData += chunk;
    })
    req.on('end', () => {
      const sqlData = dataUtil.handleData(postData);
      const selectSql = 'INSERT INTO ' + base + '(' + sqlData.keyStr + ') VALUE(' + sqlData.queMarks + ')';
      mysqlUtil.query(selectSql, sqlData.values, () => {
        console.log('数据插入成功');
        res.end();
      });
    })
  },
  loginIn (req, res) {
    let postData = '';
    req.on('data', (chunk) => {
      postData += chunk;
    })
    req.on('end', () => {
      const user = JSON.parse(postData);
      const selectSql = "select * from users where name='" + user.name + "' limit 1" ;
      mysqlUtil.query(selectSql, null, (rsl) => {
        console.log(rsl)
        if (!rsl.length || rsl[0].pwd !== user.psw) {
          res.end('账号或密码错误');
          return;
        }
        // 如果账号存在并且密码验证通过，把账号通过md5加密作为sessionId(注:crypto模块中的hash每当调用过digest方法，就会被清空掉)
        const hash = crypto.createHash('md5');
        hash.update(user.name);
        const sessionId = hash.digest('hex');
        res.writeHead(200, {
          'Content-Type': 'text/json',
          'Set-Cookie': 'sessionId=' + sessionId + ';Max-Age=1000'
        })
        session.setSession(Object.assign({
          sessionId
        }, rsl[0]));
        res.end(JSON.stringify(rsl[0]));
      })
    })
  }
}

module.exports = api;

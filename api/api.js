//用户登录—前端发送登录请求—后端保存用户 cookies—页面刷新 —前端判断用户id存在—显示登录状态—用户退出—前端发送退出请求–后端清空用户cookies—页面刷新—前端判断用户id不存在—-显示需要登录的界面

const mysqlUtil = require('../mysqlUtil.js');
const dataUtil = require('../dataUtil.js');
const session = require('../session.js');

//处理上传的文件
const fs = require('fs');
const formidable = require('formidable');
const path = require('path');
//md5加密模块
const crypto = require('crypto');

let api = {
  //查询数据并返回
  queryData (req, res, base) {
    const selectSql = 'SELECT * FROM ' + base;
    mysqlUtil.query(selectSql, null, (rsl) => {
      console.log('数据查询成功');
      res.end(JSON.stringify(rsl));
    })
  },
  insertDataToArticle (req, res, base) {
    let postData = '';
    req.on('data', (chunk) => {
      postData += chunk;
    })
    req.on('end', () => {
      const sqlData = dataUtil.handleData(postData);
      const selectSql = 'INSERT INTO article' + '(' + sqlData.keyStr + ') VALUE(' + sqlData.queMarks + ')';
      mysqlUtil.query(selectSql, sqlData.values, () => {
        console.log('数据插入成功');
        res.end();
      });
    })
  },
  //登录
  loginIn (req, res) {
    let postData = '';
    req.on('data', (chunk) => {
      postData += chunk;
    })
    req.on('end', () => {
      if (req.headers.cookie){
        const sessionId = req.headers.cookie.split('=')[1];
        const user = session.querySession(sessionId);
        res.end(JSON.stringify(user));
        return;
      }
      const user = JSON.parse(postData);
      const selectSql = "select * from users where name='" + user.name + "' limit 1" ;
      mysqlUtil.query(selectSql, null, (rsl) => {
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
          'Set-Cookie': 'sessionId=' + sessionId + ';Max-Age=60'
        })
        session.setSession(Object.assign({
          sessionId
        }, rsl[0]));
        res.end(JSON.stringify(rsl[0]));
      })
    })
  },
  isLogin (req, res) {
    res.writeHead(200, {
      'Content-Type': 'image/png'
    })
    req.on('data', (chunk) => {
      console.log(chunk)
    })
    req.on('end', () => {
      if (req.headers.cookie) {
        const sessionId = req.headers.cookie.split('=')[1];
        const user = session.querySession(sessionId);
        console.log(sessionId)
        res.end(JSON.stringify(user));
        return;
      }
      res.end('未登录');
    })
  },
  //注册账号
  registerUser (req, res) {
    let postData = '';
    req.on('data', (chunk) => {
      postData += chunk;
    })
    req.on('end', () => {
      const user = JSON.parse(postData);
      const selectSql = "select * from users where name='" + user.name + "' limit 1 ";
      mysqlUtil.query(selectSql, null, (rsl) => {
        if (rsl.length) {
          res.end('账号已存在');
          return;
        }
        //验证通过之后设置session并返回消息
        const sqlData = dataUtil.handleData(postData);
        const selectSql = "insert into users (" + sqlData.keyStr + ") value(" + sqlData.queMarks + ")";
        mysqlUtil.query(selectSql, sqlData.values, () => {
          const hash = crypto.createHash('md5');
          hash.update(user.name);
          const sessionId = hash.digest('hex');
          res.writeHead(200, {
            'Content-Type': 'text/json',
            'Set-Cookie': 'sessionId=' + sessionId + ';Max-Age=60'
          })
          session.setSession(Object.assign({
            sessionId
          }, user));
          console.log('账号注册成功');
          res.end('账号注册成功');
        })
      })
    })
  },
  //上传头像
  getPortrait (req, res) {
    const form = new formidable.IncomingForm();
    //保留文件扩展名
    form.keepExtensions = true;
    form.encoding = 'utf-8';
    form.parse(req, (err, fields, files) => {
      console.log(files.portrait);
      fs.renameSync(files.portrait.path, '../imgs/'+files.portrait.name)
      res.end('图片上传成功')
    })
  }
}

module.exports = api;
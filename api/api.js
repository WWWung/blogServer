//用户登录—前端发送登录请求—后端保存用户 cookies—页面刷新 —前端判断用户id存在—显示登录状态—用户退出—前端发送退出请求–后端清空用户cookies—页面刷新—前端判断用户id不存在—-显示需要登录的界面

//  工具类
const mysqlUtil = require('../mysqlUtil.js');
const dataUtil = require('../dataUtil.js');
const session = require('../session.js');
const cookieUtil = require('../utils/cookieUtil.js');

//处理上传的文件
const fs = require('fs');
const formidable = require('formidable');
const path = require('path');
//md5加密模块
const crypto = require('crypto');

let api = {
  //查询数据并返回
  queryArticlesData (req, res) {
    const selectSql = 'SELECT * FROM article';
    mysqlUtil.query(selectSql, null, (rsl) => {
      console.log(this.loginIn)
      console.log('博客列表查询成功');
      res.end(JSON.stringify(rsl));
    })
  },
  //  新增博客
  insertDataToArticle (req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/json'
    })
    let postData = '';
    req.on('data', (chunk) => {
      postData += chunk;
    })
    req.on('end', () => {
      const sqlData = dataUtil.handleData(postData);
      const selectSql = 'INSERT INTO article' + '(' + sqlData.keyStr + ') VALUE(' + sqlData.queMarks + ')';
      mysqlUtil.query(selectSql, sqlData.values, () => {
        console.log('博客提交成功');
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
      let sessionId = cookieUtil.getSessionIdfromCookie(req.headers.cookie);
      if (req.headers.cookie && sessionId){
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
          'Set-Cookie': 'sessionId=' + sessionId + ';Max-Age=86400'
        })
        session.setSession(Object.assign({
          sessionId
        }, rsl[0]));
        res.end(JSON.stringify(rsl[0]));
      })
    })
  },
  //  判断是否登录
  isLogin (req, res) {
    req.on('data', (chunk) => {
      console.log(chunk)
    })
    req.on('end', () => {
      const sessionId = cookieUtil.getSessionIdfromCookie(req.headers.cookie);
      console.log(req.headers.cookie)
      if (req.headers.cookie && sessionId) {
        const user = session.querySession(sessionId);
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
            'Set-Cookie': 'sessionId=' + sessionId + ';Max-Age=86400'
          })
          session.setSession(Object.assign({
            sessionId
          }, user));
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

    //  这一步是设置文件上传处理之后的保存位置
    form.uploadDir = path.join(__dirname, '../imgs')
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.log(err);
        return false;
      }

      //  由于文件保存之后会自动随机生成一个名字，所以利用nodejs的rename方法更改为上传时候的文件名
      fs.rename(files.portrait.path, path.join(__dirname, '../imgs/'+files.portrait.name), (err) => {
        if(err){
          console.log(err);
          res.end('图片上传失败');
        }else{
          res.end(files.portrait.name);
        }
      });
    })
  },
  //  返回图片
  returnImg (req, res, reqName) {
    const imgName = reqName.split('/')[1];
    const imgSrc = path.join(__dirname, '../imgs/'+imgName);
    fs.readFile(imgSrc, (err, data) => {
      if(err){
        console.log(imgSrc)
        console.log(err)
        res.end();
      }else{
        let stream = fs.createReadStream(imgSrc);
        let resData = [];
        if(stream){
          stream.on('data', (chunk) => {
            resData.push(chunk)
          })
          stream.on('end', () => {
            const finalData = Buffer.concat(resData);
            res.end(finalData);
          })
        }
      }
    })
  },
  //  根据id获取某一篇博文
  getBlogById (req, res, id) {
    const selectSql = 'select * from article where id=' + id;
    mysqlUtil.query(selectSql, null, (rsl) => {
      if (!rsl.length) {
        res.writeHead(404, {
          'Content-Type': 'text/plain'
        })
        res.end('页面未找到');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      })
      this.getCommentsByBlogId(req, res, rsl[0]);
    })
  },
  //  退出登录
  loginOut (req, res) {
      if (!req.headers.cookie) {
        res.end();
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/json',
          'Set-Cookie': 'sessionId=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
        })
        res.end('已登出');
      }
    },
  //  返回评论
  getCommentsByBlogId (req, res, blog) {
    const sql = "select * from comment where blogId=" + blog.id;
    mysqlUtil.query(sql, null, (rsl) => {
      console.log('博客评论查询成功');
      blog.comments = rsl;
      res.end(JSON.stringify(blog));
    })
  },
  //  提交评论
  insertCommentToBlog (req, res, blogId) {

  }
}

module.exports = api;

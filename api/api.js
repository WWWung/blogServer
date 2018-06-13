//用户登录—前端发送登录请求—后端保存用户 cookies—页面刷新 —前端判断用户id存在—显示登录状态—用户退出—前端发送退出请求–后端清空用户cookies—页面刷新—前端判断用户id不存在—-显示需要登录的界面

//  工具类
const mysqlUtil = require('../utils/mysqlUtil.js');
const dataUtil = require('../utils/dataUtil.js');
const session = require('../utils/sessionUtil.js');
const cookieUtil = require('../utils/cookieUtil.js');

//  处理上传的文件
const fs = require('fs');
const formidable = require('formidable');
const path = require('path');
const cheerio = require('cheerio')

//  md5加密模块
const crypto = require('crypto');

//  正式代码
let api = {
  //查询数据并返回
  queryArticlesData (req, res, urlInfo) {
    const start = urlInfo.query.start || 0;
    const end = urlInfo.query.end || 5;
    const selectSql = 'SELECT * FROM article where support = 1 limit ' + start + ',' + end;
    mysqlUtil.query(selectSql, rsl => {
      console.log('博客列表查询成功');
      //  通过cheerio模块解析博客的html文档内容，并且判断里面是否有图片，如果有，把第一张图片的信息保存下来
      for (let i=0; i<rsl.length; i++) {
        const $ = cheerio.load(rsl[i].content);
        if ($('img').length) {
          rsl[i].thumbnail = {
            src: $('img').eq(0).attr('src'),
            alt: $('img').eq(0).attr('alt')
          }
        } else {
          rsl[i].thumbnail = null;
        }
      }
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
      const data = JSON.parse(postData);
      const sqlData = dataUtil.handleData(data);
      const id = data.id;
      let sql = "";
      if (id === undefined) {
        sql = 'insert into article set ' + sqlData;
      } else {
        sql = 'update article set ' + sqlData + 'where id=' + id;
      }
      mysqlUtil.query(sql, () => {
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
      mysqlUtil.query(selectSql, (rsl) => {
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
          //  如果没有httpOnly这个属性的话，那么在浏览器application里会找不到cookie，只能在network里请求的详细信息里看到
          'Set-Cookie': 'sessionId=' + sessionId + ';Max-Age=86400;httpOnly:false'
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
      mysqlUtil.query(selectSql, (rsl) => {
        if (rsl.length) {
          res.end('账号已存在');
          return;
        }
        //验证通过之后设置session并返回消息
        const sqlData = dataUtil.handleData(postData);
        const selectSql = "insert into users set " + sqlData;
        mysqlUtil.query(selectSql, () => {
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
  //上传图片
  getPortrait (req, res) {
    const form = new formidable.IncomingForm();
    //保留文件扩展名
    form.keepExtensions = true;
    form.encoding = 'utf-8';

    //  这一步是设置文件上传处理之后的保存位置
    form.uploadDir = path.join(__dirname, '../assets/imgs')
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.log(err);
        return false;
      }

      //  由于文件保存之后会自动随机生成一个名字，所以利用nodejs的rename方法更改为上传时候的文件名
      const imgName = Date.now() + files.image.name;
      fs.rename(files.image.path, path.join(__dirname, '../assets/imgs/' + imgName), (err) => {
        if(err){
          console.log(err);
          res.end('图片上传失败');
        }else{
          res.end(imgName);
        }
      });
    })
  },
  //  返回图片
  returnImg (req, res, reqName) {
    const imgName = reqName.split('/')[1];
    const imgSrc = path.join(__dirname, '../assets/imgs/'+imgName);
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
  //  根据id获取某一篇博文及其评论
  getBlogById (req, res, id) {
    const sql = 'select * from article where id = ' + id + '; select * from article where id < ' + id + ' order by id desc limit 1; select * from article where id > ' + id + ' order by id asc limit 1'
    mysqlUtil.query(sql, rsl => {
      //  执行多条sql语句的时候返回值是一个数组，数组项是依次执行查询语句的结果
      if (!rsl[0].length) {
        res.writeHead(404, {
          'Content-Type': 'text/plain'
        })
        res.end('页面未找到');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/json'
      })
      //  提取博客下的评论
      let data = {
        current: rsl[0][0],
        prev: rsl[1].length?rsl[1][0]:null,
        next: rsl[2].length?rsl[2][0]:null
      }
      this.getCommentsByBlogId(req, res, data);
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
  //  根据博客id获取相应的评论
  getCommentsByBlogId (req, res, data) {
    const sql = "select * from comment where blogId=" + data.current.id;
    mysqlUtil.query(sql, rsl => {
      console.log('博客评论查询成功');
      data.current.comments = rsl;
      const returnData = JSON.stringify(data);
      res.end(returnData);
    })
  },
  //  提交评论
  insertCommentToBlog (req, res) {
    let postData = '';
    req.on('data', (chunk) => {
      postData += chunk;
    })
    req.on('end', () => {
      const sqlData = dataUtil.handleData(postData);
      const sql = 'insert into comment set ' + sqlData;
      mysqlUtil.query(sql, () => {
        console.log('评论成功');
        res.end();
      })
    })
  },
  //  修改个人信息
  editUserInfo (req, res) {
    let postData = '';
    req.on('data', chunk => {
      postData += chunk;
    })
    req.on('end', () => {
      let user = JSON.parse(postData);
      const id = user.id;
      const sqlData = dataUtil.handleData(user);
      const sql = 'update users set ' + sqlData + ' where id=' + id;
      mysqlUtil.query(sql, () => {
        console.log('个人信息更新成功');
        //  更新session
        const sessionId = cookieUtil.getSessionIdfromCookie(req.headers.cookie);
        session.deleteSession(sessionId);
        session.setSession(Object.assign(user, {
          sessionId
        }))
        res.end();
      })
    })
  },
  //  查看个人信息
  selfInfo (req, res, name) {
    const sql = 'select * from users where name="' + name + '"';
    mysqlUtil.query(sql, rsl => {
      if (rsl.length) {
        console.log('查看个人信息成功');
        res.end(JSON.stringify(rsl[0]));
      } else {
        console.log('查看个人信息失败');
        res.end('账号不存在');
      }
    })
  },
  //  根据id查找已有的博客（编辑博客）
  editBlogById (req, res, id) {
    const sql = 'select * from  article where id=' + id;
    mysqlUtil.query(sql, rsl => {
      if (rsl.length) {
        console.log('博客查询成功');
        res.end(JSON.stringify(rsl[0]));
      } else {
        console.log('博客不存在');
        res.writeHead(404, {
          'Content-Type': 'text/plain'
        });
        res.end('博客不存在');
      }
    })
  },
  //  发送私信
  sendSecretMessage (req, res) {
    let postData = '';
    req.on('data', chunk => {
      postData += chunk;
    })
    req.on('end', err => {
      const message = JSON.parse(postData);
      const sqlData = dataUtil.handleData(postData);
      const sql = 'insert into secret_message set ' + sqlData;
      mysqlUtil.query(sql, () => {
        console.log('私信发送成功');
        res.end();
      })
    })
  },
  //  返回未读状态的私信数量
  returnUnreadMsg (req, res, receiveId) {
    const sql = 'select * from secret_message where id=' + receiveId + ' and status = 0';
    mysqlUtil.query(sql, rsl => {
      res.end(rsl.length);
    })
  }
}

module.exports = api;

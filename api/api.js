
//  工具类
const mysqlUtil = require('../utils/mysqlUtil.js');
const dataUtil = require('../utils/dataUtil.js');
const session = require('../utils/sessionUtil.js');
const cookieUtil = require('../utils/cookieUtil.js');

//  处理上传的文件
const fs = require('fs');
const formidable = require('formidable');

//  路径
const path = require('path');

//  处理html字符串，语法类似于jq
const cheerio = require('cheerio')

//  md5加密模块
const crypto = require('crypto');

//  异步流程控制
const async = require('async')

//  正式代码
let api = {
  //查询数据并返回
  queryArticlesData (req, res, urlInfo) {
    const start = urlInfo.query.start || 0;
    const end = urlInfo.query.end || 5;
    const selectSql = 'SELECT * FROM article where support = 1 limit ' + start + ',' + end;
    mysqlUtil.query(selectSql, (err, rsl) => {
      if (err) {
        console.log('博客列表查询失败');
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
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
    let postData = '';
    req.on('data', (chunk) => {
      postData += chunk;
    })
    req.on('end', err => {
      if (err) {
        console.log('博客插入失败');
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
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
      mysqlUtil.query(selectSql, (err, rsl) => {
        if (err) {
          console.log('登录失败');
          res.writeHead(403, {
            'Content-Type': 'text/plain'
          })
          res.end();
          return false;
        }
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
      mysqlUtil.query(selectSql, (err, rsl) => {
        if (err) {
          console.log('账号注册失败');
          res.writeHead(403, {
            'Content-Type': 'text/plain'
          })
          res.end();
          return false;
        }
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
    // const sql = 'select * from article where id = ' + id + '; select * from article where id < ' + id + ' order by id desc limit 1; select * from article where id > ' + id + ' order by id asc limit 1'
    // mysqlUtil.query(sql, (err, rsl) => {
    //   //  执行多条sql语句的时候返回值是一个数组，数组项是依次执行查询语句的结果
    //   if (!rsl[0].length) {
    //     res.writeHead(404, {
    //       'Content-Type': 'text/plain'
    //     })
    //     res.end('页面未找到');
    //     return;
    //   }
    //   res.writeHead(200, {
    //     'Content-Type': 'text/json'
    //   })
    //   //  提取博客下的评论
    //   let data = {
    //     current: rsl[0][0],
    //     prev: rsl[1].length?rsl[1][0]:null,
    //     next: rsl[2].length?rsl[2][0]:null
    //   }
    //   this.getCommentsByBlogId(req, res, data);
    // })
    let data = {};
    const sqls = [
      {
        sql: 'select * from article where id=' + id,
        name: 'current'
      },
      {
        sql: 'select * from article where id<' + id + ' order by id desc limit 1',
        name: 'prev'
      },
      {
        sql: 'select * from article where id>' + id + ' order by id asc limit 1',
        name: 'next'
      }
    ]
    async.each(sqls, (item, callback) => {
      mysqlUtil.query(item.sql, (err, rsl) => {
        callback(err);
        if (!err) {
          data[item.name] = rsl[0];
        }
      })
    }, err => {
      if (err) {
        console.log(err)
      }
      console.log(data)
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
    mysqlUtil.query(sql, (err, rsl) => {
      if (err) {
        console.log('评论列表查询失败');
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
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
      mysqlUtil.query(sql, (err) => {
        if (err) {
          console.log('评论信息插入失败');
          res.writeHead(403, {
            'Content-Type': 'text/plain'
          })
          res.end();
          return false;
        }
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
      mysqlUtil.query(sql, (err) => {
        if (err) {
          console.log('个人信息更新失败');
          res.writeHead(403, {
            'Content-Type': 'text/plain'
          })
          res.end();
          return false;
        }
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
    mysqlUtil.query(sql, (err, rsl) => {
      if (err) {
        console.log('个人信息查询失败');
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
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
    mysqlUtil.query(sql, (err, rsl) => {
      if (err) {
        console.log('博客查询失败');
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
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
      const message1 = JSON.parse(postData);
      const message2 = JSON.parse(postData);
      //  创建两个对象，收件人和发件人各一份
      //  userid属性代表这条私信属于哪个用户，friendid代表与userid交互的用户
      //  这样设计的目的在于，把每条私信创建了两份，在查表的时候更加方便，同时当某一方删除私信的时候，另一方不受影响
      //  劣势：使数据库变得冗余；两份content占用过多空间（可以把content再单独做一份表，因为两份私信的内容是相同的）
      message1.userId = message1.sendId;
      message1.friendId = message1.receiveId;

      message2.userId = message1.receiveId;
      message2.friendId = message1.sendId;

      const datas = [
        dataUtil.handleData(message1),
        dataUtil.handleData(message2)
      ];

      async.each(datas, (sqlData, callback) => {
        const sql = 'insert into secret_message set ' + sqlData;
        mysqlUtil.query(sql, err => {
          callback(err);
        })
      }, err => {
        if (err) {
          console.log('私信插入失败');
          res.writeHead(403, {
            'Content-Type': 'text/plain'
          })
          res.end();
          return false;
        }
        console.log('私信发送成功');
        res.end();
      })
    })
  },
  //  返回未读状态的私信数量
  returnUnreadMsg (req, res, receiveId) {
    const sql = 'select * from secret_message where receiveId=' + receiveId + ' and status = 0 and userId=' + receiveId;
    mysqlUtil.query(sql, (err, rsl) => {
      if (err) {
        console.log('私信查询失败');
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
      res.end(JSON.stringify(rsl));
    })
  },
  getMsgList (req, res, userId) {
    
  }
  //  获取某用户的私信列表-------------------（虽然用了async模块，但还是嵌套了多层回调函数，代码有待优化...）
  /*
  * 逻辑梳理:
  *   1. 用async.waterfall执行两次数据库查询，获取该用户收和发的所有私信
  *   2. 把用户的收发私信拼接成一个数组，然后用async.each根据数组中每一项的sendid查找所有私信的发信人信息
  *   3. 同2，查询数组中每一项的收信人信息
  */
  /*
  放弃这种写法
  getMsgList (req, res, userId) {
    async.waterfall([
      //  查询该用户接收到的所有私信
      callback => {
        const sql = 'select * from secret_message where receiveId=' + userId;
        mysqlUtil.query(sql, (err, rsl1) => {
          callback(err, rsl1)
        })
      },
      //  查询该用户发送出去的所有私信
      (rsl1, callback) => {
        const sql = 'select * from secret_message where sendId=' + userId;
        mysqlUtil.query(sql, (err, rsl2) => {
          callback(err, rsl1, rsl2)
        })
      }
    ], (err, rsl1, rsl2) => {
      if (err) {
        console.log('查询出错');
        console.log(err);
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
      //  将该用户收发的私信拼接成一个数组
      const data = rsl1.concat(rsl2);
      async.each(data, (item, callback) => {

        const sendSql = 'select * from users where id=' + item.sendId;
        mysqlUtil.query(sendSql, (err, rsl) => {
          callback(err);
          if (rsl.length) {
            item['sendUserInfo'] = rsl[0];
          } else {
            item['sendUserInfo'] = null;
          }
        })
      }, err => {
        if (err) {
          console.log(err);
          console.log('用户查询失败');
          res.writeHead(403, {
            'Content-Type': 'text/plain'
          })
          res.end();
          return false;
        }
        async.each(data, (item, callback) => {
          const receiveSql = 'select * from users where id=' + item.receiveId;
          mysqlUtil.query(receiveSql, (err, rsl) => {
            callback(err);
            if (rsl.length) {
              item['receiveUserInfo'] = rsl[0];
            } else {
              item['receiveUserInfo'] = null;
            }
          })
        }, err => {
          if (err) {
            console.log(err);
            console.log('用户查询失败');
            res.writeHead(403, {
              'Content-Type': 'text/plain'
            })
            res.end();
            return false;
          }
          res.end(JSON.stringify(data))
        })
      })
    })
  }
  */
}

module.exports = api;

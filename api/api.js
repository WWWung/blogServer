
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
  //查询博客列表数据并返回
  queryArticlesData (req, res, urlInfo) {
    const start = urlInfo.query.start || 0;
    const end = urlInfo.query.end || 5;
    const mold = urlInfo.query.mold || 0;
    const selectSql = 'SELECT id, title, time, clickNumber, userId, type, up, support, star, mold, content, textContent FROM article where mold = ' + mold + ' limit ' + start + ',' + end;
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
      const selectSql = "select id from users where name='" + user.name + "' limit 1 ";
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
        mysqlUtil.query(selectSql, (r, f) => {
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
          const data = {
            msg: '账号注册成功',
            id: f.insertId
          }
          res.end(JSON.stringify(data));
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
    //==========================================================================================
    async.waterfall([
      cb => {
        const sql = `select commentNumber, id, title, time, clickNumber userId, type, content, up, mold, star, prevTitle, prevId, nextId, nextTitle from
                    (select c.id, c.title, c.time as time, c.clickNumber as clickNumber, c.userId as userId, c.type as type, c.content as content, c.up as up, c.mold as mold, c.star as star, c.prevTitle, c.prevId, d.id as nextId, d.title as nextTitle from
                    (select a.id as id, a.title as title, a.time as time, a.clickNumber as clickNumber, a.userId as userId, a.type as type, a.content as content, a.up as up, a.mold as mold, a.star as star, b.title as prevTitle, b.id as prevId from
                    (select id, title, time, clickNumber, userId, type, content, up, support, star, mold from article where id=` + id + `)
                    as a left join
                    (select id, title from article where id<` + id + ` order by id desc limit 1)
                    as b on a.id>b.id) as c left join
                    (select id, title from article where id>` + id + ` order by id asc limit 1)
                    as d on c.id<d.id) as e,
                    (select count(id) as commentNumber from comment where blogId=1) as f`;
        mysqlUtil.query(sql, (err, rsl) => {
          cb(err, rsl)
        })
      },
      (rsl, cb) => {
        const sql = 'select comment.id, userId, blogId, content, time, floor, users.name as username, users.imageUrl as imgUrl from comment, users where blogId=' + id + ' and users.id=userId order by time desc'
        mysqlUtil.query(sql, (err, rsl2) => {
          cb(err, rsl, rsl2)
        })
      }
    ], (err, rsl, rsl2) => {
      if (err || !rsl.length) {
        console.log('文章查询失败');
        console.log(err);
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
      rsl[0].comments = rsl2;
      res.end(JSON.stringify(rsl[0]));
      const sql = 'update article set clickNumber=clickNumber+1 where id=' + id;
      mysqlUtil.query(sql, (err, rsl, f) => {
        if (err) {
          console.log(err)
        }
      })
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
    console.log(data)
    const sql = "select * from comment where blogId=" + data.current.id + ' order by time desc';
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
    const sql = 'select id, name, phone, sex, qq, email, address, lastLoginIp, birthday, description, imageUrl, school, registerTime, weibo, locked from users where name="' + name + '"';
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

      //  type 0 代表是发送的信息 type 1代表是接收的信息
      message1.type = 0;

      message2.userId = message1.friendId;
      message2.friendId = message1.userId;
      message2.type = 1;

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
    const sql = 'select * from secret_message where type=1 and status = 0 and userId=' + receiveId;
    mysqlUtil.query(sql, (err, rsl) => {
      if (err) {
        console.log(err);
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
  //  获取与所有人的收发信息中的时间最晚一条
  getMsgList (req, res, userId) {
    // 这种sql返回的顺序不固定，原因未知，待续...
    // const msgSql = 'select a.id, content, time, status, userId, type, friendId, name, imageUrl '
    //              + 'from (select * from secret_message where userId=' + userId + ' ORDER BY time desc) as a, users '
    //              + 'where a.friendId=users.id '
    //              + 'group by friendId '
    //              + 'order by time desc';

    //  先按时间顺序排列所有的私信。然后再按friendId分组。最后再按时间顺序排序一遍 (该方法在mysql5.6以上不可用，因为高版本会先执行group by再执行order by)
    const msgSql = 'select * from (select * from secret_message where userId=' + userId + ' ORDER BY time desc) as a group by a.friendId order by a.time desc';
    mysqlUtil.query(msgSql, (err, rsl) => {
      if (err) {
        console.log(err);
        console.log('查询私信列表失败');
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
      // res.end(JSON.stringify(rsl));

      async.each(rsl, (item, callback) => {
        const sql = 'select id, name, imageUrl from users where id=' + item.friendId;
        mysqlUtil.query(sql, (err, rsl2) => {
          item.imageUrl = rsl2[0].imageUrl;
          item.name = rsl2[0].name;
          callback(err);
        })
      }, err => {
        if (err) {
          console.log(err);
          console.log('查询用户资料失败');
          res.writeHead(403, {
            'Content-Type': 'text/plain'
          })
          res.end();
          return false;
        }
        res.end(JSON.stringify(rsl));
      })
    })
  },
  //  获取与某个人的所有私信记录
  getChatList (req, res, query) {
    if (typeof query.userId !== 'string' || typeof query.friendId !== 'string') {
      console.log('url参数不全');
      res.writeHead(403, {
        'Content-Type': 'text/plain'
      })
      res.end();
      return false;
    }
    const start = query.start || 0;
    const count = query.count || 5;

    // const sql = `select id, content, time, status, userId, friendId, type, count(id) as total from secret_message
    //             where friendId=` + query.friendId
    //             + ` and userId=` + query.userId
    //             + ` order by time desc limit `
    //             + start + ',' + count;
    // mysqlUtil.query(sql, (err, rsl) => {
    //   console.log()
    //   const data = {
    //     data: rsl,
    //     start: Number.parseInt(start),
    //     count: Number.parseInt(count),
    //     total: rsl[0].count
    //   }
    //   res.end(JSON.stringify(data));
    // })

    const sqls = [
      {
        name: 'data',
        sql: 'select * from secret_message where friendId=' + query.friendId + ' and userId=' + query.userId + ' order by time desc limit ' + start + ',' + count
      },
      {
        name: 'total',
        sql: 'select count(id) as total from secret_message where userId=' + query.userId + ' and friendId=' + query.friendId
      }
    ]
    let data = {
      start: Number.parseInt(start),
      count: Number.parseInt(count)
    };
    async.each(sqls, (sql, callback) => {
      mysqlUtil.query(sql.sql, (err, rsl) => {
        if (sql.name === 'data') {
          console.log(rsl);
          console.log('-------------------------------------------------------------------')
        }
        data[sql.name] = rsl
        callback(err)
      })
    }, err => {
      if (err) {
        console.log(err);
        console.log('查询聊天记录失败');
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
      res.end(JSON.stringify(data))
      //  从数据库返回数据的时候同时把这个数据里接收的信息全部设置为已读
      const readsql = 'update secret_message set status=1 where status=0 and type=1 and userId=' + query.userId + ' and friendId=' + query.friendId + ' order by time desc limit ' + count;
      mysqlUtil.query(readsql, err => {
        if (err) {
          console.log('设置已读失败');
        } else {
          console.log('设置已读成功');
        }
      })
    })
  },
  //  阅读与某人的私信记录
  readAllChat (req, res, query) {
    const sql = 'update secret_message set status=1 where status=0 and type=1 and userId=' + query.userId;
    mysqlUtil.query(sql, err => {
      if (err) {
        console.log('设置所有消息已读失败')
        console.log(err);
        res.end('设置所有消息已读失败');
      } else {
        console.log('设置所有消息已读成功');
        res.end('设置所有消息已读成功');
      }
    })
  },
  //  插入留言
  leaveWord (req, res) {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    })
    req.on('end', () => {
      const sqlData = dataUtil.handleData(data);
      console.log(data)
      const sql = 'insert into words set ' + sqlData;
      mysqlUtil.query(sql, (err, rsl) => {
        if (err) {
          console.log(err);
          console.log('留言插入失败');
          res.writeHead(403, {
            'Content-Type': 'text/plain'
          })
          res.end();
          return false;
        }
        res.end();
      })
    })
  },
  //  查询留言
  getLeaveWords (req, res, query) {
    const page = query.page || 1;
    const pageCount = query.pageCount || 20;
    const limitStart = (page - 1) * pageCount;
    const data = {
      page: Number.parseInt(page),
      pageCount: Number.parseInt(pageCount),
    }
    async.waterfall([
      /*
      #select words.id, userId, content, time, reply, name, imageUrl from words, users where words.userId=users.id
      select c.id, c.userId, c.time, c.reply, c.content, c.replyContent, c.replyUserId, c.targetName, users.name as name, imageUrl from
      ((select b.id, b.userId, b.time, b.reply, b.content, b.replyContent, b.replyUserId, users.name as targetName from
      (select a.userId, a.id, a.reply, a.time, a.content as content, words.content as replyContent, words.userId as replyUserId from words as a left join words on a.reply=words.id) as b
      left join users on b.replyUserId=users.id)) as c inner join users on c.userId=users.id order by time desc

      先用words表连接words表（根据reply的id查询回复留言的内容和作者id=replyUserId）得到表b
      再用b和users连接（根据replyUserId查询回复的作者名字）得到表c
      再用c和users连接（根据userid查询到这条留言的作者名字和作者头像链接）
      */
      cb => {
        const sql = 'select c.id, c.userId, c.time, c.reply, c.content, c.replyContent, c.replyUserId, c.targetName, users.name as name, imageUrl from '
                  + '((select b.id, b.userId, b.time, b.reply, b.content, b.replyContent, b.replyUserId, users.name as targetName from '
                  + '(select a.userId, a.id, a.reply, a.time, a.content as content, words.content as replyContent, words.userId as replyUserId from words as a left join words on a.reply=words.id) as b '
                  + 'left join users on b.replyUserId=users.id)) as c inner join users on c.userId=users.id order by time desc';
        mysqlUtil.query(sql, (err, rsl1) => {
          cb(err, rsl1);
        })
      },
      (rsl1, cb) => {
        const sql = 'select count(id) as total from words';
        mysqlUtil.query(sql, (err, rsl2) => {
          cb(err, rsl1, rsl2);
        })
      }
    ], (err, rsl1, rsl2) => {
      if (err) {
        console.log(err);
        console.log('查询留言记录失败');
        res.writeHead(403, {
          'Content-Type': 'text/plain'
        })
        res.end();
        return false;
      }
      data.data = rsl1;
      data.total = rsl2[0].total;
      res.end(JSON.stringify(data));
    })
  },
  //  查看用户留言与某人的所有对话(已放弃！！！)
  // getReplyList (req, res, query) {
  //   const page = query.page || 1;
  //   const pageCount = query.pageCount || 20;
  //   const limitStart = (page - 1) * pageCount;
  //   const data = {
  //     page: Number.parseInt(page),
  //     pageCount: Number.parseInt(pageCount),
  //   }
  //   if (page === 1) {
  //     pageCount--;
  //   }
  //   async.waterfall([
  //     cb => {
  //       //  第一层子查询c，通过回复的留言id查询到要回复的作者id，根据作者id和传参过来的用户id查询这两个用户之间的所有的对话
  //       //  第二层子查询b，通过第一层查询结果里的userid找到找到这个user的头像链接和名字
  //       //  第三层子查询d，通过第二层查询结果里的reply
  //       const sql = 'select d.id, d.userId, content, time, reply, d.name, d.imageUrl, users.name as targetName from'
  //                 + '(select b.id, b,userId, content, time, reply, users.name as name, imageUrl, startUserId from '
  //                 + '(select id, userId, content, time, reply, c.userId as startUserId from words, (select userId from words where id=' + query.targetId + ') as c '
  //                 + 'where (reply=c.userId and words.userId=' + query.userId
  //                 + ') or (reply=' + query.userId + ' and words.userId=c.userId) ) as b, users where b.userId=users.id) as d, users'
  //                 + 'where d.startUserId=users.id'
  //                 + 'order by time limit' + limitStart + ',' + pageCount;
  //       mysqlUtil.query(sql, (err, rsl1) => {
  //         cb(err, rsl1);
  //       })
  //     },
  //     (rsl1, cb) => {
  //       const sql = 'select count(id) as total from words, (select userId from words where id=' + query.targetId + ') as c '
  //                 + 'where (reply=c.userId and words.userId=' + query.userId
  //                 + ') or (reply=' + query.userId + ' and words.userId=c.userId) ';
  //       mysqlUtil.query(sql, (err, rsl2) => {
  //         cb(err, rsl1, rsl2);
  //       })
  //     }
  //     // (rsl1, rsl2, cb) => {
  //     //   if (page === 1) {
  //     //     const sql = 'select id, userId, content, time, reply from words where id=' + query.targetId;
  //     //   }
  //     // }
  //   ], (err, rsl1, rsl2) => {
  //     if (err) {
  //       console.log(err);
  //       console.log('查询留言对话失败');
  //       res.writeHead(403, {
  //         'Content-Type': 'text/plain'
  //       })
  //       res.end();
  //       return false;
  //     }
  //     data.data = rsl1;
  //     data.total = rsl2[0].total;
  //     res.end(JSON.stringify(data));
  //   })
  // }
}

module.exports = api;

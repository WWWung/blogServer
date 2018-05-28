const http = require('http');
const url = require('url');

// const mysqlUtil = require('./mysqlUtil.js');//关于数据库的操作
// const dataUtil = require('./dataUtil.js');//处理数据格式
const api = require('./api/api.js')

const port = 3000;
const host = '127.0.0.8';
let count = 0;
http.createServer((req, res) => {
  //设置允许跨域
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  //  为了跨域设置cookie
  res.setHeader('Access-Control-Allow-Credentials', true);

  //处理url里包含的信息
  const urlInfo = url.parse(req.url, true);
  const baseName = urlInfo.query.baseName;
  const reqName = urlInfo.pathname.substring(1);
  //请求的类型
  const method = req.method.toLowerCase();
  if(reqName === 'loginIn'){//  登录
    api.loginIn(req, res);
  }
  if(reqName === 'submitArticle'){//  提交博客
    api.insertDataToArticle(req, res);
  }
  if(reqName === 'register'){// 注册账号
    api.registerUser(req, res);
  }
  if(reqName === 'isLogin'){//  判断是否登录
    api.isLogin(req, res);
  }
  if(reqName === 'portrait'){// 保存头像
    api.getPortrait(req, res);
  }
  if(reqName === 'articles'){// 文章列表
    api.queryArticlesData(req, res);
  }
  if(reqName === 'article'){//  文章
    api.getBlogById(req, res, urlInfo.query.id);
  }
  if(reqName.indexOf('imgs') > -1){// 返回头像
    api.returnImg(req, res, reqName);
  }
  if(reqName === 'loginOut'){// 退出登录
    api.loginOut(req, res);
  }
  if(reqName === 'subComent'){
    api.insertCommentToBlog(req, res);
  }
  if(reqName === 'editInfo'){
    api.editUserInfo(req, res);
  }
}).listen(port, host);
console.log('Server running at http:' + host + ':' + port);

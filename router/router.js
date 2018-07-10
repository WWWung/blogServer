const api = require('../api/api.js');

exports.route = (req, res, urlInfo) => {
  const reqName = urlInfo.pathname.substring(1);

  if (reqName === 'loginIn') {//  登录
    api.loginIn(req, res);
  }
  if (reqName === 'submitArticle') {//  提交博客
    api.insertDataToArticle(req, res);
  }
  if (reqName === 'register') {// 注册账号
    api.registerUser(req, res);
  }
  if (reqName === 'isLogin') {//  判断是否登录
    api.isLogin(req, res);
  }
  if (reqName === 'portrait') {// 保存头像
    api.getPortrait(req, res);
  }
  if (reqName === 'blogs') {// 文章列表
    api.queryArticlesData(req, res, urlInfo);
  }
  if (reqName === 'article') {//  文章
    api.getBlogById(req, res, urlInfo.query.id);
  }
  if (reqName.indexOf('imgs') > -1) {// 返回头像
    api.returnImg(req, res, reqName);
  }
  if (reqName === 'loginOut') {// 退出登录
    api.loginOut(req, res);
  }
  if (reqName === 'subComent') {
    api.insertCommentToBlog(req, res);
  }
  if (reqName === 'editInfo') {
    api.editUserInfo(req, res);
  }
  if (reqName === 'self') {
    api.selfInfo(req, res, urlInfo.query.name);
  }
  if (reqName === 'edit') {
    api.editBlogById(req, res, urlInfo.query.id);
  }
  if (reqName === 'message') {
    api.sendSecretMessage(req, res);
  }
  if (reqName === 'unreadmsg') {
    api.returnUnreadMsg(req, res, urlInfo.query.receiveId);
  }
  if (reqName === 'messagelist') {
    api.getMsgList(req, res, urlInfo.query.id);
  }
  if (reqName === 'chat') {
    api.getChatList(req, res, urlInfo.query);
  }
  if (reqName === 'readAll') {
    api.readAllChat(req, res, urlInfo.query);
  }
  if (reqName === 'getwords') {
    api.getLeaveWords(req, res, urlInfo.query);
  }
  if (reqName === 'leaveword') {
    api.leaveWord(req, res);
  }
  if (reqName === 'readreply') {
    api.getReplyList(req, res, urlInfo.query);
  }
}

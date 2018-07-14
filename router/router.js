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
  if (reqName === 'subComent') {//  提交评论
    api.insertCommentToBlog(req, res);
  }
  if (reqName === 'editInfo') {// 编辑个人资料
    api.editUserInfo(req, res);
  }
  if (reqName === 'self') {// 查看个人资料
    api.selfInfo(req, res, urlInfo.query.id);
  }
  if (reqName === 'edit') {// 编辑博客
    api.editBlogById(req, res, urlInfo.query.id);
  }
  if (reqName === 'message') {//  发送私信
    api.sendSecretMessage(req, res);
  }
  if (reqName === 'unreadmsg') {//  返回未读消息
    api.returnUnreadMsg(req, res, urlInfo.query.receiveId);
  }
  if (reqName === 'messagelist') {//  返回私信列表
    api.getMsgList(req, res, urlInfo.query.id);
  }
  if (reqName === 'chat') {// 返回聊天记录
    api.getChatList(req, res, urlInfo.query);
  }
  if (reqName === 'readAll') {//  设置所有消息已读
    api.readAllChat(req, res, urlInfo.query);
  }
  if (reqName === 'getwords') {// 返回留言列表
    api.getLeaveWords(req, res, urlInfo.query);
  }
  if (reqName === 'leaveword') {//  留言
    api.leaveWord(req, res);
  }
  if (reqName === 'readreply') {//  查看回复
    api.getReplyList(req, res, urlInfo.query);
  }
  if (reqName === 'comments') {// 查看博客评论
    api.getCommentsByBlogId(req, res, urlInfo.query);
  }
  if (reqName === 'follow') {// 收藏博客
    api.followBlog(req, res, urlInfo.query);
  }
  if (reqName === 'unfollow') {// 取消博客收藏
    api.unfollowBlog(req, res, urlInfo.query);
  }
  if (reqName === 'followlist') {// 获取收藏列表
    api.getFollowlist(req, res, urlInfo.query);
  }
}

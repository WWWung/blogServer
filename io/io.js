const ioUtil = require('../utils/ioUtil.js');
const dataUtil = require('../utils/dataUtil.js');
const mysqlUtil = require('../utils/mysqlUtil.js');

//  io发射事件命名：
//    chat with friend (from server to target): 从服务端发送聊天的信息到接收信息的客户端
//    chat with friend (from server to author): 从服务端发送聊天的信息到发送信息的客户端
//    chat with friend (from client)： 从客户端发送聊天信息到服务端
//    login:  客户端连入

exports.io = server => {
  //  储存所有连接的客户端
  let sockets = [];
  const io = require('socket.io')(server);
  io.on('connection', socket => {
    console.log('客户端已连接');
    socket.on('login', data => {
      ioUtil.insertClient(data, sockets);
    })

    socket.on('chat with friend (from client)', data => {
      // api.sendSecretMessage(data);
      getChatMessageByIo(data, io, sockets);
      console.log(sockets)
    })

    socket.on('disconnect', () => {
      ioUtil.deleteClient(socket.id, sockets);
      console.log('客户端已退出');
    })
  })
}

function getChatMessageByIo (message1, io, sockets) {
  const message2 = JSON.parse(JSON.stringify(message1));
  message1.type = 0;

  message2.userId = message1.friendId;
  message2.friendId = message1.userId;
  message2.type = 1;

  const sql2 = 'insert into secret_message set ' + dataUtil.handleData(message2);
  let ioId1 = ioUtil.findClient(message2.userId, sockets);
  if (ioId1 !== null) {
    message2.status = 1;
  }
  mysqlUtil.query(sql2, (err, rsl) => {
    if (err) {
      console.log(err);
      console.log('插入私信出错');
    } else {
      if (ioId1 !== null) {
        message2.id = rsl.insertId;
        io.sockets.sockets[ioId1].emit('chat with friend (from server to target)', message2);
      }
      console.log('插入私信成功');
    }
  });

  const sql1 = 'insert into secret_message set ' + dataUtil.handleData(message1);
  mysqlUtil.query(sql1, (err, rsl) => {
    if (err) {
      console.log(err);
      console.log('插入私信出错');
    } else {
      const ioId = ioUtil.findClient(message1.userId, sockets);
      if (ioId !== null) {
        message1.id = rsl.insertId;
        io.sockets.sockets[ioId].emit('chat with friend (from server to author)', message1);
      }
      console.log('插入私信成功');
    }
  });
}

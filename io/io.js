const ioUtil = require('../utils/ioUtil.js');
const dataUtil = require('../utils/dataUtil.js');
const mysqlUtil = require('../utils/mysqlUtil.js');

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

  const sql1 = 'insert into secret_message set ' + dataUtil.handleData(message1)
  mysqlUtil.query(sql1, (err, rsl) => {
    if (err) {
      console.log(err);
      console.log('插入私信出错');
    } else {
      const ioId = ioUtil.findClient(message1.friendId, sockets);
      console.log(message1.friendId)
      if (ioId !== null) {
        message1.id = rsl.insertId;
        io.sockets.sockets[ioId].emit('chat with friend (from server)', message1);
      }
      console.log('插入私信成功');
    }
  });

  const sql2 = 'insert into secret_message set ' + dataUtil.handleData(message2)
  mysqlUtil.query(sql2, (err, rsl) => {
    if (err) {
      console.log(err);
      console.log('插入私信出错');
    } else {
      console.log('插入私信成功');
    }
  });
}

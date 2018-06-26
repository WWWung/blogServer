//  userSocket: 储存每个用户信息的数组
//  userSocket中的每一项为 { ioId: Number, userId: Number  } 当userId为0的时候，即未登录，为游客

const utils = {
  //  判断一个socketId是否存在，如果存在，返回位置，否则返回-1
  hasClient (data, userSocket) {
    let index = -1;
    for (let i=0; i<userSocket.length; i++) {
      if (userSocket[i].ioId === data.ioId) {
        index = i;
        break;
      }
    }
    return index
  },
  //  当一个socketId存在的时候覆盖，否则插入
  insertClient (data, userSocket) {
    const index = this.hasClient(data, userSocket);
    if (index < 0) {
      return userSocket.push(data);
    }
    userSocket.splice(index, 1, data);
    return userSocket.length;
  },
  //  删除
  deleteClient (ioId, userSocket) {
    const index =this. hasClient({ioId}, userSocket);
    if (index < 0) {
      return true;
    }
    return userSocket.splice(index, 1)[0];
  },
  //  根据userId找到userSocket中的项
  findClient (userId, userSocket) {
    let index = -1;
    for (let i=0; i<userSocket.length; i++) {
      if (userSocket[i].userId === userId) {
        index = i;
        break;
      }
    }
    return index < 0 ? null : userSocket[index].ioId
  }
}

module.exports = utils;

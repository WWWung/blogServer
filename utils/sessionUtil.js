const fs = require('fs');
const users = require('../users/users.json');
const session = {
  getSession () {
    return users;
  },
  setSession (user) {
    if (this.querySession(user.sessionId)){
      return false;
    }
    users.push(user);
    fs.writeFileSync('./users/users.json', JSON.stringify(users));
    return true;
  },
  querySession (sessionId) {
    let rsl = null;
    for(let i=0; i<users.length; i++){
      if (sessionId === users[i].sessionId) {
        rsl = users[i];
        break;
      }
    }
    return rsl;
  },
  deleteSession (sessionId) {
    let index = null;
    for(i=0; i<users.length; i++){
      if(users[i].sessionId === sessionId){
        index = i;
        break;
      }
    }
    if(index !== null){
      users.splice(index, 1);
      fs.writeFileSync('./users/users.json', JSON.stringify(users));
      return true;
    }
    return false;
  }
}
module.exports = session;

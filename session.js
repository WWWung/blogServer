const fs = require('fs');
const users = require('./users/users.json');
const session = {
  getSession () {
    return users;
  },
  setSession (user) {
    console.log(this.querySession(user.sessionId))
    if (this.querySession(user.sessionId)){
      return;
    }
    users.push(user);
    fs.writeFileSync('./users/users.json', JSON.stringify(users), (err) => {
      console.log(err)
    })
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
  }
}
module.exports = session;

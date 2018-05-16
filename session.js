const fs = require('fs');
const users = require('./users/users.json');
const session = {
  getSession () {
    return users;
  },
  setSession (user) {
    if (this.querySession(user, users)){
      return;
    }
    users.push(user);
    fs.writeFileSync('./users/users.json', JSON.stringify(users), (err) => {
      console.log(err)
    })
  },
  querySession (user) {
    let rsl = false;
    for(let i=0; i<users.length; i++){
      if (user.sessionId === users[i].sessionId) {
        rsl = true;
        break;
      }
    }
    return rsl;
  }
}
module.exports = session;

const users = require(./users/users.json);

const session = {
  getSession () {
    return users;
  }
  setSession (user, users) {
    users.push(user);
  }
  querySession (user, users) {
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

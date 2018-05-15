//获取
const mysqlUtil = require('../mysqlUtil.js');
const dataUtil = require('../dataUtil.js');

let api = {
  queryData (req, res, base) {
    const selectSql = 'SELECT * FROM ' + base;
    mysqlUtil.query(selectSql, null, (rsl) => {
      console.log('数据查询成功');
      res.end(JSON.stringify(rsl));
    })
  },
  insertData (req, res, base) {
    let postData = '';
    req.on('data', (chunk) => {
      postData += chunk;
    })
    req.on('end', () => {
      const sqlData = mysqlUtil.handleData(postData);
      const selectSql = 'INSERT INTO ' + base + '(' + sqlData.keyStr + ') VALUE(' + sqlData.queMarks + ')';
      mysqlUtil.query(selectSql, sqlData.values, () => {
        console.log('数据插入成功');
      });
    })
  },
  loginIn (name, psw) {
    const selectSql = 'SELECT * FROM users';
    mysqlUtil.query(selectSql, null, (rsl) => {
      for(let i=0; i<rsl.length; i++){
        if(name === rsl[i].name && psw === rsl[i].psw){

        }
      }
    })
  }
}

module.exports = api;

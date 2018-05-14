const mysql = require('mysql');

//创建连接池
const pool = mysql.createPool({
  host: 'gz-cdb-jm7yuqdy.sql.tencentcdb.com',
  port: 62691,
  user: 'root',
  password: 'wj531096404',
  database: 'blog'
})

//增删改差函数
exports.query = function (selectSql, params, callback) {
  pool.getConnection((err, con) => {
    if( err ){
      console.log('连接数据库出错');
      return;
    }
    con.query(selectSql, params, (cerr, rsl, fields) => {
      if( cerr ){
        console.log(cerr)
        console.log('数据库查询出错');
        return;
      }
      if( typeof callback === 'function' ){
        callback(rsl);
      }
    })
  })
}

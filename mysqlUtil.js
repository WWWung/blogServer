const mysql = require('mysql');

//创建连接池
const pool = mysql.createPool({
  host: 'gz-cdb-jm7yuqdy.sql.tencentcdb.com',
  port: 62691,
  user: 'root',
  password: 'wj531096404',
  database: 'blog'
})

//增删改查函数
exports.query = function (selectSql, callback) {
  pool.getConnection((err, con) => {
    if( err ){
      console.log('连接数据库出错');
      return;
    }
    con.query(selectSql, (cerr, rsl, fields) => {
      if( cerr ){
        console.log(cerr)
        console.log('数据库查询出错');
        return;
      }
      con.release();
      //  释放链接（如果不加这句代码，访问十次数据库之后就会访问不上）
      if( typeof callback === 'function' ){
        callback(rsl);
      }
    })
  })
}

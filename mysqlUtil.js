const mysql = require('mysql');

//  promise的包,具体如何promise化query函数还在构思 zzz
// const Q = require('q');

//创建连接池
const pool = mysql.createPool({
  host: 'gz-cdb-jm7yuqdy.sql.tencentcdb.com',
  port: 62691,
  user: 'root',
  password: 'wj531096404',
  database: 'blog',
  multipleStatements: true  //  这个属性设置为true之后可以执行多条sql语句，以；分割
})

//增删改查函数
exports.query = function (selectSql, callback) {
  pool.getConnection((err, con) => {
    if(err){
      console.log('连接数据库出错');
      return;
    }
    con.query(selectSql, (cerr, rsl, fields) => {
      if(cerr){
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

/*
*
*以id7为例查询id为7及上一篇和下一篇的博客sql语句
*'select * from article where id = 7; select * from article where id < 7 order by id desc limit 1; select * from article where id > 7 order by id asc limit 1'
*/

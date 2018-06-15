const mysql = require('mysql');
const config = require('../config/config.js');
const async = require('async')

//  promise的包,具体如何promise化query函数还在构思 zzz
// const Q = require('q');

//创建连接池
const pool = mysql.createPool(config.mysql)

//增删改查函数
exports.query = function (selectSql, callback) {
  pool.getConnection((err, con) => {
    if(err){
      console.log('连接数据库出错');
      return;
    }
    con.query(selectSql, (cerr, rsl, fields) => {
      // if(cerr){
      //   console.log(cerr)
      //   console.log('数据库查询出错');
      //   return;
      // }
      //  2018.06.15 更改：把报错信息在回调函数中处理
      con.release();
      //  释放链接（如果不加这句代码，访问十次数据库之后就会访问不上）
      if( typeof callback === 'function' ){
        callback(cerr, rsl);
      }
    })
  })
}

/*
*
*以id7为例查询id为7及上一篇和下一篇的博客sql语句
*'select * from article where id = 7; select * from article where id < 7 order by id desc limit 1; select * from article where id > 7 order by id asc limit 1'
*/

//  2018.06.15更改：取消多条sql语句查询，改用asynce处理

// const sqls = [
//   'select * from article where id = 6',
//   'select * from article where id = 7',
//   'select * from article zwhere id = 8',
// ];
// var data = [];
// async.each(sqls, (sql, callback) => {
//   exports.query(sql, (err, rsl) => {
//     console.log(rsl);
//     callback(err)
//     console.log('--------------------------------------------')
//     data.push(rsl)
//   })
// }, err => {
//   if (err) {
//     console.log(err);
//     console.log('执行失败')
//   } else {
//     console.log('执行成功')
//     console.log(data)
//   }
// })

//  async.waterfall与async.each的区别在于warerfall强调顺序，是按顺序执行，并且将上一个回调函数执行的结果按序往下传递，在全部执行完毕最后的回调函数里对这些结果进行统一处理,
//  而async.each则是同时执行，没有绝对的顺序先后，所以回调函数出发的时间也不可预知

// async.waterfall([
//   callback => {
//     exports.query('select * from article where id = 6', (err, rsl1) => {
//       callback(err, rsl1)
//     })
//   },
//   (rsl1, callback) => {
//     exports.query('select * from article where id = 7', (err, rsl2) => {
//       callback(err,rsl1, rsl2)
//     })
//   },
//   (rsl1, rsl2, callback) => {
//     exports.query('select * from article where id = 8', (err, rsl3) => {
//       callback(err, rsl1, rsl2, rsl3)
//     })
//   }
// ], (err, rsl1, rsl2, rsl3) => {
//   if (err) {
//     console.log('执行失败');
//   } else {
//     console.log(rsl1);
//     console.log('---------------------------')
//     console.log(rsl2);
//     console.log('---------------------------')
//     console.log(rsl3);
//     console.log('---------------------------')
//   }
// })

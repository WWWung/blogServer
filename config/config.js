const config = {
  server: {
    port: 3000,
    host: ''
  },
  mysql: {
    host: 'gz-cdb-jm7yuqdy.sql.tencentcdb.com',
    port: 62691,
    user: 'root',
    password: 'wj531096404',
    database: 'blog'
    // multipleStatements: true  //  这个属性设置为true之后可以执行多条sql语句，以；分割  //  2018.06.15 删除这条，如果有多条sql，用async或者promise处理
  }
};

module.exports = config;

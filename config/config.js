const config = {
  server: {
    port: 3000,
    host: '127.0.0.8'
  },
  mysql: {
    host: 'gz-cdb-jm7yuqdy.sql.tencentcdb.com',
    port: 62691,
    user: 'root',
    password: 'wj531096404',
    database: 'blog',
    multipleStatements: true  //  这个属性设置为true之后可以执行多条sql语句，以；分割
  }
};

module.exports = config;

import { registerAs } from '@nestjs/config'

export default registerAs('db', () => ({
  type: 'mysql', // 数据库类型
  host: process.env.DB_SERVER_HOST, // host
  port: process.env.DB_SERVER_PORT, // 端口
  database: process.env.DB_SERVER_DATABASE, // 库名
  username: process.env.DB_SERVER_USERNAME, // 账号
  password: process.env.DB_SERVER_PASSWORD, // 密码
  // entities: [__dirname + '/**/*.entity{.ts,.js}'], // 实体文件
  // entities: [User, Role, Permission],
  logging: true,
  synchronize: true, // 字段代表是否自动将实体类同步到数据库，正式环境不建议使用，会导致数据丢失
  // synchronize: process.env.NODE_ENV === 'local',
  poolSize: 10, // 连接池大小
  connectorPackage: 'mysql2', // 数据库连接驱动
  retryDelay: 500, // 重试连接数据库间隔
  retryAttempts: 10, // 重试连接数据库的次数
  autoLoadEntities: true, // 如果为true,将自动加载实体 forFeature()方法注册的每个实体都将自动添加到配置对象的实体数组中，不建议在生产环境中使用
  extra: {
    authPlugin: 'sha256_password'
  }
}))

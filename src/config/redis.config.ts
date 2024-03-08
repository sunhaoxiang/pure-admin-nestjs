import { registerAs } from '@nestjs/config'

export default registerAs('redis', () => ({
  host: process.env.REDIS_SERVER_HOST,
  post: process.env.REDIS_SERVER_PORT,
  database: process.env.REDIS_SERVER_DATABASE
}))

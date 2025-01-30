import { registerAs } from '@nestjs/config'

export default registerAs('redis', () => ({
  type: process.env.REDIS_TYPE,
  url: process.env.REDIS_URL,
}))

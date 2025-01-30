import { registerAs } from '@nestjs/config'

export default registerAs('throttler', () => [
  {
    ttl: Number.parseInt(process.env.THROTTLER_TTL, 10),
    limit: Number.parseInt(process.env.THROTTLER_LIMIT, 10),
  },
])

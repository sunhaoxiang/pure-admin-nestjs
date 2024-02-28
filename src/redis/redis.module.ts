import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'

import { RedisService } from './redis.service'

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      async useFactory(configService: ConfigService) {
        const client = createClient({
          socket: {
            host: configService.get('REDIS_SERVER_HOST'),
            port: configService.get('REDIS_SERVER_PORT')
          },
          database: configService.get('REDIS_SERVER_DATABASE')
        })
        await client.connect()
        return client
      },
      inject: [ConfigService]
    }
  ],
  exports: [RedisService]
})
export class RedisModule {}

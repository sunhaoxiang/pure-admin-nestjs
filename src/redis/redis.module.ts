import { DynamicModule, Global, Module, ModuleMetadata, Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, RedisClientType } from 'redis'

import { RedisService } from './redis.service'

// export interface RedisOptionsFactory {
//   createJwtOptions(): Promise<RedisModuleOptions> | RedisModuleOptions
// }

interface RedisConfig {
  host: string
  port: number
  database: number
}

export interface RedisModuleOptions {
  useFactory?: (...args: any[]) => Promise<RedisConfig> | RedisConfig
  inject?: any[]
  imports?: any[]
  extraProviders?: Provider[]
}

@Global()
@Module({})
export class RedisModule {
  static forRootAsync(redisModuleOptions: RedisModuleOptions): DynamicModule {
    const redisClientProvider = {
      provide: 'REDIS_CLIENT',
      async useFactory(configService: ConfigService) {
        const options = await redisModuleOptions.useFactory(configService)
        const client = createClient({
          socket: {
            host: options.host,
            port: options.port
          },
          database: options.database
        })
        await client.connect()
        return client
      },
      inject: redisModuleOptions.inject || []
    }

    return {
      module: RedisModule,
      imports: redisModuleOptions.imports || [],
      providers: [redisClientProvider, RedisService, ...(redisModuleOptions.extraProviders ?? [])],
      exports: [RedisService]
    }
  }
}

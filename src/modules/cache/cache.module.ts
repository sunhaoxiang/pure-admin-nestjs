import { RedisModule } from '@nestjs-modules/ioredis'
import { DynamicModule, Global, Module, Provider } from '@nestjs/common'

import { CacheService } from './cache.service'

export interface CacheConfig {
  type: 'single'
  url: string
}

export interface CacheModuleOptions {
  useFactory?: (...args: any[]) => Promise<CacheConfig> | CacheConfig
  inject?: any[]
  imports?: any[]
  extraProviders?: Provider[]
}

@Global()
@Module({})
export class CacheModule {
  static forRootAsync(cacheModuleOptions: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        ...(cacheModuleOptions.imports || []),
        RedisModule.forRootAsync({
          useFactory: cacheModuleOptions.useFactory,
          inject: cacheModuleOptions.inject || [],
        }),
      ],
      providers: [CacheService, ...(cacheModuleOptions.extraProviders ?? [])],
      exports: [CacheService],
    }
  }
}

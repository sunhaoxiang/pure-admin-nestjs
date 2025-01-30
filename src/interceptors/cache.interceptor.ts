import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Observable, of, tap } from 'rxjs'
import { Logger } from 'winston'

import { CacheService } from '@/modules/cache/cache.service'

export const CACHE_KEY = 'CACHE'
export const CACHE_TTL_KEY = 'CACHE_TTL'

export const CacheKey = (prefix: string) => SetMetadata(CACHE_KEY, prefix)
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl)

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly DEFAULT_CACHE_TTL = 60 * 60 // 默认缓存时间 1 小时
  private readonly CACHE_NAMESPACE = 'api' // 缓存命名空间

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const prefix = this.reflector.get<string>(CACHE_KEY, context.getHandler())

    if (!prefix)
      return next.handle()

    const ttl
      = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler()) || this.DEFAULT_CACHE_TTL

    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest<FastifyRequest>()
    const queryParams = Object.entries(request.query)
      .map(([key, value]) => `${key}-${value || ''}`)
      .join('|')
    const cacheKey = `${this.CACHE_NAMESPACE}:${prefix}:${queryParams || 'default'}`

    try {
      const cachedRawData = await this.cacheService.get(cacheKey)
      if (cachedRawData) {
        const cachedData = JSON.parse(cachedRawData)
        this.logger.info(`Cache hit: ${cacheKey}`)
        return of(cachedData)
      }

      this.logger.info(`Cache miss: ${cacheKey}`)

      return next.handle().pipe(
        tap(async (data) => {
          if (data) {
            await this.cacheService.set(cacheKey, JSON.stringify(data), ttl)
          }
        }),
      )
    }
    catch {
      return next.handle()
    }
  }
}

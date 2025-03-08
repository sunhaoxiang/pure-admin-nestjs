import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Observable, of, tap } from 'rxjs'
import { Logger } from 'winston'

import {
  CACHE_INVALIDATE_KEY,
  CACHE_INVALIDATE_USER_KEY,
  CACHE_KEY,
  CACHE_TTL_KEY,
  CACHE_USER_KEY,
} from '@/decorators'
import { CacheService } from '@/modules/cache/cache.service'

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly DEFAULT_CACHE_TTL = 60 * 60 // 默认缓存时间 1 小时
  private readonly CACHE_NAMESPACE = 'api' // 缓存命名空间

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private generateCacheKey(
    prefix: string | undefined,
    userPrefix: string | undefined,
    userId: number | undefined,
    queryParams: string,
  ): string | null {
    if (!prefix && !userPrefix)
      return null

    const baseKey = `${this.CACHE_NAMESPACE}:`
    const queryString = queryParams || 'default'

    if (prefix) {
      return `${baseKey}${prefix}:${queryString}`
    }

    return `${baseKey}${userPrefix}:${userId}:${queryString}`
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // 获取缓存前缀
    const prefix = this.reflector.get<string>(CACHE_KEY, context.getHandler())
    const userPrefix = this.reflector.get<string>(CACHE_USER_KEY, context.getHandler())

    // 获取需要清除的缓存前缀
    const invalidatePrefixes = this.reflector.get<string[]>(CACHE_INVALIDATE_KEY, context.getHandler()) || []
    const invalidateUserPrefixes = this.reflector.get<{
      prefixes: string[]
      userIdSelector?: (req: any) => number | number[]
    }>(CACHE_INVALIDATE_USER_KEY, context.getHandler()) || {
      prefixes: [],
      userIdSelector: undefined,
    }

    if (!prefix && !userPrefix && invalidatePrefixes.length === 0 && invalidateUserPrefixes.prefixes.length === 0) {
      return next.handle()
    }

    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler()) || this.DEFAULT_CACHE_TTL

    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest<FastifyRequest>()
    const queryParams = Object.entries(request.query)
      .map(([key, value]) => `${key}-${value || ''}`)
      .join('|')
    const userId = request.user?.id as number

    const cacheKey = this.generateCacheKey(prefix, userPrefix, userId, queryParams)

    try {
      // 如果是读取操作（有缓存键），尝试从缓存获取数据
      if (cacheKey) {
        const cachedRawData = await this.cacheService.get(cacheKey)
        if (cachedRawData) {
          const cachedData = JSON.parse(cachedRawData)
          this.logger.info(`Cache hit: ${cacheKey}`)
          return of(cachedData)
        }

        this.logger.info(`Cache miss: ${cacheKey}`)
      }

      // 处理请求并根据需要更新或清除缓存
      return next.handle().pipe(
        tap(async (data) => {
          // 如果是读取操作且有返回数据，则存储到缓存
          if (data && cacheKey) {
            await this.cacheService.set(cacheKey, JSON.stringify(data), ttl)
          }

          // 处理普通缓存失效
          if (invalidatePrefixes.length > 0) {
            for (const invalidatePrefix of invalidatePrefixes) {
              const count = await this.cacheService.deleteByPrefix(this.CACHE_NAMESPACE, invalidatePrefix)
              if (count > 0) {
                this.logger.info(`已清除前缀为 ${invalidatePrefix} 的 ${count} 个缓存条目`)
              }
            }
          }

          // 处理用户相关的缓存失效
          // if (userId && invalidateUserPrefixes.length > 0) {
          //   for (const invalidateUserPrefix of invalidateUserPrefixes) {
          //     const userSpecificPrefix = `${invalidateUserPrefix}:${userId}`
          //     const count = await this.cacheService.deleteByPrefix(this.CACHE_NAMESPACE, userSpecificPrefix)
          //     if (count > 0) {
          //       this.logger.info(`已清除前缀为 ${userSpecificPrefix} 的 ${count} 个用户缓存条目`)
          //     }
          //   }
          // }

          if (invalidateUserPrefixes) {
            let userIds: number[] = []

            if (invalidateUserPrefixes.userIdSelector) {
              const selectedIds = invalidateUserPrefixes.userIdSelector(request)

              if (Array.isArray(selectedIds)) {
                userIds = selectedIds
              }
              else {
                userIds = [selectedIds]
              }
            }
            else {
              userIds = [userId]
            }

            // 清除指定用户的缓存
            for (const userId of userIds) {
              for (const invalidateUserPrefix of invalidateUserPrefixes.prefixes) {
                const userSpecificPrefix = `${invalidateUserPrefix}:${userId}`
                const count = await this.cacheService.deleteByPrefix(this.CACHE_NAMESPACE, userSpecificPrefix)
                if (count > 0) {
                  this.logger.info(`已清除前缀为 ${userSpecificPrefix} 的 ${count} 个用户缓存条目`)
                }
              }
            }
          }
        }),
      )
    }
    catch (error) {
      this.logger.error(`缓存操作出错: ${error.message}`, error)
      return next.handle()
    }
  }
}

import { SetMetadata } from '@nestjs/common'

export const CACHE_KEY = 'CACHE'
export const CACHE_TTL_KEY = 'CACHE_TTL'

export const CacheKey = (prefix: string) => SetMetadata(CACHE_KEY, prefix)
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl)

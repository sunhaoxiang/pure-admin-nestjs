import { SetMetadata } from '@nestjs/common'

export const CACHE_KEY = 'CACHE'
export const CACHE_TTL_KEY = 'CACHE_TTL'
export const CACHE_USER_KEY = 'CACHE_USER'
export const CACHE_INVALIDATE_KEY = 'CACHE_INVALIDATE'
export const CACHE_INVALIDATE_USER_KEY = 'CACHE_INVALIDATE_USER'

// 用于设置缓存前缀
export const CacheKey = (prefix: string) => SetMetadata(CACHE_KEY, prefix)

// 用于设置用户缓存前缀
export const CacheUserKey = (prefix: string) => SetMetadata(CACHE_USER_KEY, prefix)

// 用于设置缓存过期时间
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl)

// 用于清除普通缓存，可接收单个前缀或前缀数组
export function CacheInvalidate(prefixes: string | string[]) {
  return SetMetadata(CACHE_INVALIDATE_KEY, Array.isArray(prefixes) ? prefixes : [prefixes])
}

// 用于清除用户相关的缓存，可接收单个前缀或前缀数组
// export function CacheInvalidateUser(prefixes: string | string[]) {
//   return SetMetadata(CACHE_INVALIDATE_USER_KEY, Array.isArray(prefixes) ? prefixes : [prefixes])
// }
export function CacheInvalidateUser(
  prefixes: string | string[],
  userIdSelector?: (req: any) => number | number[],
) {
  return SetMetadata(CACHE_INVALIDATE_USER_KEY, {
    prefixes: Array.isArray(prefixes) ? prefixes : [prefixes],
    userIdSelector,
  })
}

import { InjectRedis } from '@nestjs-modules/ioredis'
import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class CacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get(key: string) {
    return this.redis.get(key)
  }

  async set(key: string, value: string | number, ttl?: number) {
    await this.redis.set(key, value)

    if (ttl) {
      await this.redis.expire(key, ttl)
    }
  }

  async lpop(key: string) {
    const value = await this.redis.lpop(key)
    return value ? JSON.parse(value) : null
  }

  async rpush(key: string, value: any) {
    const values = Array.isArray(value)
      ? value.map(item => JSON.stringify(item))
      : [JSON.stringify(value)]

    return this.redis.rpush(key, ...values)
  }

  async llen(key: string) {
    return this.redis.llen(key)
  }

  async del(key: string) {
    return this.redis.del(key)
  }

  async keys(pattern: string) {
    return this.redis.keys(pattern)
  }

  /**
   * 删除所有指定前缀的键
   * @param prefix - 键前缀
   * @returns 删除的键的数量
   */
  async deleteByPrefix(namespace: string, prefix: string): Promise<number> {
    const pattern = `${namespace}:${prefix}*`
    const keys = await this.redis.keys(pattern)

    if (keys.length === 0) {
      return 0
    }

    return this.redis.unlink(...keys)
  }

  /**
   * 获取所有缓存键
   * @param namespace - 缓存命名空间
   * @returns 缓存键列表
   */
  async getAllKeys(namespace: string): Promise<string[]> {
    return await this.redis.keys(`${namespace}:*`)
  }

  /**
   * 获取缓存使用情况
   * @param namespace - 缓存命名空间
   * @returns 缓存使用情况
   */
  async getStats(namespace: string): Promise<{
    totalKeys: number
    memoryUsage: string
  }> {
    const info = await this.redis.info('memory')
    const keys = await this.getAllKeys(namespace)

    return {
      totalKeys: keys.length,
      memoryUsage: info.match(/used_memory_human:(\S+)/)?.[1] || '0B',
    }
  }
}

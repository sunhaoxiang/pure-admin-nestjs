import { BadRequestException, ParseIntPipe } from '@nestjs/common'
import dayjs from 'dayjs'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import winston from 'winston'

const scryptAsync = promisify(crypto.scrypt)

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function md5(str: string) {
  const hash = crypto.createHash('md5')
  hash.update(str)
  return hash.digest('hex')
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':')
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer
  return key === derivedKey.toString('hex')
}

export function generateParseIntPipe(name: string) {
  return new ParseIntPipe({
    exceptionFactory() {
      throw new BadRequestException(`${name} 应该传数字`)
    },
  })
}

export function getEnvPath(dest: string): string {
  const env: string | undefined = process.env.NODE_ENV

  const filename: string = env ? `.env.${env}` : '.env'

  // 尝试多个可能的路径
  const possiblePaths = [
    path.resolve(process.cwd(), filename), // 从当前工作目录查找
    path.resolve(process.cwd(), 'dist', filename), // 从 dist 目录查找
    path.resolve(__dirname, '..', filename), // 从当前文件所在目录的上一级查找
    path.resolve(dest, filename), // 从指定目录查找
  ]

  // 查找第一个存在的文件路径
  const existingPath = possiblePaths.find(filePath => fs.existsSync(filePath))

  if (!existingPath) {
    console.warn('没有找到 env 文件')
    return path.resolve(process.cwd(), filename) // 返回默认路径
  }

  return existingPath
}

/**
 * 将 kebab-case 字符串转换为 camelCase
 * @param str kebab-case 格式的字符串
 * @returns camelCase 格式的字符串
 */
export function kebabToCamelCase(str: string | null | undefined): string {
  if (!str) {
    return ''
  }

  return str
    .split('-')
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('')
}

export function createLevelFilter(level: string) {
  return winston.format((info) => {
    return info.level === level ? info : false
  })()
}

export function createLoggerOptions(type: string, logDir: string) {
  return {
    level: type,
    dirname: path.join(logDir, type),
    filename: `[${process.env.NEST_SERVER_PORT}]-[${type}]-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false, // 不压缩
    maxSize: '1m', // 单个文件最大1M
    maxFiles: '14d', // 保留14天的日志
  }
}

export function defaultLogFormat(hasFilter = false, level: string = 'http') {
  const commonFormats = [
    winston.format.timestamp({
      format: () => dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }),
    winston.format.printf((info: any) => {
      return `[${info.timestamp}] [${info.level}]: ${info.message}`
    }),
  ]

  // 如果需要过滤日志，则添加过滤器
  return winston.format.combine(...(hasFilter ? [createLevelFilter(level)] : []), ...commonFormats)
}

export function isHttpUrl(url: string) {
  return /^https?:\/\//.test(url)
}

/**
 * 创建单字段模糊搜索条件
 * @param field 要搜索的字段名
 * @param value 搜索值
 * @returns Prisma contains 条件对象
 */
export function createFuzzySearchFilter<T extends string>(
  field: T,
  value?: string,
): { [K in T]?: { contains: string } } {
  if (!value?.trim()) {
    return {} as { [K in T]?: { contains: string } }
  }

  return {
    [field]: { contains: value.trim() },
  } as { [K in T]?: { contains: string } }
}

/**
 * 创建逗号分隔的模糊搜索条件
 * @param field 要搜索的字段名
 * @param value 逗号分隔的搜索值
 * @returns Prisma OR 条件数组
 */
export function createCommaSearchFilter<T extends string>(
  field: T,
  value?: string,
): { OR?: Array<{ [K in T]: { contains: string } }> } {
  if (!value) {
    return {}
  }

  // 去除字符串开头和结尾的逗号，并分割字符串
  const values = value
    .trim()
    .replace(/^,+|,+$/g, '')
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)

  if (values.length === 0) {
    return {}
  }

  return {
    OR: values.map(
      item =>
        ({
          [field]: { contains: item },
        }) as { [K in T]: { contains: string } },
    ),
  }
}

/**
 * 计算分页参数
 * @param page 当前页码（从1开始）
 * @param pageSize 每页数量
 * @returns [skip, take] 元组，用于 Prisma 查询
 */
export function createPaginationParams(rawPage: number, rawPageSize: number) {
  const normalizedPage = Math.max(1, rawPage)
  const normalizedPageSize = Math.max(1, rawPageSize)

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
  }
}

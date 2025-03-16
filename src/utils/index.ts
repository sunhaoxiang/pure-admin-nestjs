import dayjs from 'dayjs'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import winston from 'winston'

const scryptAsync = promisify(crypto.scrypt)

/**
 * 延迟执行
 * @param ms 延迟时间（毫秒）
 * @returns 延迟执行的 Promise
 */
export function delay(ms: number): Promise<void> {
  // const { promise, resolve } = Promise.withResolvers<void>()
  // setTimeout(resolve, ms)
  // return promise
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * 哈希密码
 * @param password 密码
 * @returns 哈希值
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * 验证密码
 * @param password 密码
 * @param hash 哈希值
 * @returns 如果密码匹配，则返回 true，否则返回 false
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':')
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer
  return key === derivedKey.toString('hex')
}

/**
 * 获取环境文件路径
 * @param dest 目标路径
 * @returns 环境文件路径
 */
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

/**
 * 创建日志过滤器
 * @param level 日志级别
 * @returns 日志过滤器
 */
export function createLevelFilter(level: string) {
  return winston.format((info) => {
    return info.level === level ? info : false
  })()
}

/**
 * 创建日志选项
 * @param type 日志类型
 * @param logDir 日志目录
 * @returns 日志选项
 */
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

/**
 * 默认日志格式
 * @param hasFilter 是否需要过滤日志
 * @param level 日志级别
 * @returns 日志格式
 */
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

/**
 * 判断是否为 HTTP URL
 * @param url 要判断的 URL
 * @returns 如果 URL 以 http:// 或 https:// 开头，则返回 true，否则返回 false
 */
export function isHttpUrl(url: string) {
  return /^https?:\/\//.test(url)
}

interface QueryFilterOptions<T extends string, V> {
  field: T
  value?: V
  isFuzzy?: boolean
}

/**
 * 创建单字段查询条件
 * @param options 查询选项
 * @param options.field 字段名
 * @param options.value 值
 * @param options.isFuzzy 是否使用模糊搜索（仅对字符串类型有效）
 */
export function createSingleFieldFilter<T extends string, V>({
  field,
  value,
  isFuzzy = false,
}: QueryFilterOptions<T, V>) {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    return {}
  }

  if (typeof value === 'string' && isFuzzy) {
    return {
      [field]: { contains: value.trim() },
    }
  }

  return {
    [field]: value,
  }
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
 * @param rawPage 当前页码（从1开始）
 * @param rawPageSize 每页数量
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

/**
 * 树节点类型
 */
export type TreeNode<T> = T & { children?: TreeNode<T>[] }

/**
 * 将扁平数据转换为树形结构
 * @param flatData 扁平数据
 * @param rootId 根节点ID
 * @returns 树形结构
 */
export function convertFlatDataToTree<T extends { id: number, parentId?: number, sort: number }>(flatData: T[], rootId?: number): TreeNode<T>[] {
  const map: Record<number, TreeNode<T>> = {}
  const roots: TreeNode<T>[] = []

  // 将所有节点添加到 map 中，以 id 作为 key
  flatData.forEach((node) => {
    map[node.id] = { ...node } as TreeNode<T> // 明确类型转换为 TreeNode<T>
  })

  // 遍历所有节点，构建树形结构
  flatData.forEach((node) => {
    const parentNode = map[node.parentId ?? rootId]
    if (parentNode) {
      let children = parentNode.children
      if (!children) {
        children = []
        Object.assign(parentNode, { children }) // 添加 children 属性
      }
      children.push(map[node.id])
    }
    else {
      // 如果找不到父节点，将当前节点作为根节点
      roots.push(map[node.id])
    }
  })

  // 移除空的 children 属性
  const cleanUpEmptyChildren = (nodes: TreeNode<T>[]): TreeNode<T>[] =>
    nodes
      .sort((a, b) => a.sort - b.sort)
      .map(node => ({
        ...node,
        children: node.children && node.children.length > 0 ? cleanUpEmptyChildren(node.children) : undefined,
      }))

  return cleanUpEmptyChildren(roots)
}

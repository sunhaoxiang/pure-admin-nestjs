import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

import { BadRequestException, ParseIntPipe } from '@nestjs/common'

export function md5(str: string) {
  const hash = crypto.createHash('md5')
  hash.update(str)
  return hash.digest('hex')
}

export function generateParseIntPipe(name: string) {
  return new ParseIntPipe({
    exceptionFactory() {
      throw new BadRequestException(`${name} 应该传数字`)
    }
  })
}

export function getEnvPath(dest: string): string {
  const env: string | undefined = process.env.NODE_ENV
  const fallback: string = path.resolve(`${dest}/.env`)
  const filename: string = env ? `.env.${env}` : '.env'
  let filePath: string = path.resolve(`${dest}/${filename}`)

  if (!fs.existsSync(filePath)) {
    filePath = fallback
  }

  return filePath
}

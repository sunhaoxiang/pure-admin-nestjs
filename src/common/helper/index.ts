import * as fs from 'fs'
import * as path from 'path'

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

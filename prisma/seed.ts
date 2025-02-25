import { Prisma, PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(crypto.scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

const prisma = new PrismaClient()

async function main() {
  const username = 'pure-admin'
  const password = await hashPassword('123456')
  console.log(password)

  const newUser: Prisma.UserCreateInput = {
    username,
    password,
    email: 'admin@pure-admin.com',
    nickName: 'admin',
    phone: '13333333333',
    isSuperAdmin: true,
  }
  const user = await prisma.user.create({
    data: newUser,
  })
  console.log(user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

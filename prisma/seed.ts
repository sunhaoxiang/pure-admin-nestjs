import * as crypto from 'crypto'

import { Prisma, PrismaClient } from '@prisma/client'

function md5(str: string) {
  const hash = crypto.createHash('md5')
  hash.update(str)
  return hash.digest('hex')
}

const prisma = new PrismaClient()

async function main() {
  const newUser: Prisma.UserCreateInput = {
    username: 'admin',
    password: md5('123456'),
    email: 'admin@easy-admin.com',
    nickName: 'admin',
    phoneNumber: '13333333333',
    isAdmin: true
  }
  const user = await prisma.user.create({
    data: newUser
  })
  console.log(user)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

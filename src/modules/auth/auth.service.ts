import { Injectable, UnauthorizedException } from '@nestjs/common'

import { CacheService } from '@/modules/cache/cache.service'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { UserService } from '@/modules/user/user.service'
import { UserAuthorizationInfo } from '@/types'
import { verifyPassword } from '@/utils'

export const CACHE_KEY_PERMISSIONS_ALL = 'auth:permissions:all'
export const CACHE_TTL_PERMISSIONS_ALL = 60 * 60 * 24

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
    private readonly userService: UserService,
  ) {}

  async validateUser(username: string, rawPassword: string) {
    const user = await this.userService.findUser(
      {
        where: { username },
        select: { id: true, username: true, password: true },
      },
    )

    if (!user || !(await verifyPassword(rawPassword, user.password))) {
      throw new UnauthorizedException({ message: '用户名或密码错误' })
    }

    return user
  }

  // async getAllPermissions() {
  //   const cachedPermissions = await this.cacheService.get(CACHE_KEY_PERMISSIONS_ALL)
  //   if (cachedPermissions) {
  //     return JSON.parse(cachedPermissions)
  //   }

  //   const result = await this.prismaService.permission.findMany()
  //   const permissions = result.map(item => item.code)
  //   await this.cacheService.set(CACHE_KEY_PERMISSIONS_ALL, JSON.stringify(permissions), CACHE_TTL_PERMISSIONS_ALL)

  //   return permissions
  // }

  // async getUserAuthorizationInfo(userId: number): Promise<UserAuthorizationInfo> {
  //   const cachedPermissions = await this.cacheService.get(`auth:permissions:${userId}`)
  //   if (cachedPermissions) {
  //     return JSON.parse(cachedPermissions)
  //   }

  //   const user = await this.userService.findUserWithRoles({ id: userId })
  //   const userAuthorizationInfo: UserAuthorizationInfo = this.userService.transformUserInfo(user)

  //   await this.cacheService.set(`auth:permissions:${userId}`, JSON.stringify(userAuthorizationInfo), 60 * 60 * 24)

  //   return userAuthorizationInfo
  // }

  // async checkPermission(permission: string) {
  //   const permissions = await this.getAllPermissions()
  //   return permissions.includes(permission)
  // }
}

import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

import { CacheService } from '@/modules/cache/cache.service'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { hashPassword } from '@/utils'

import { RegisterUserDto } from './dto/register-user.dto'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserListVo } from './vo/user-list.vo'

export type UserWithRolesAndPermissions = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    }
  }
}>

export interface TransformedUserInfo {
  id: number
  username: string
  // roles: number[]
  permissions: string[]
  isAdmin: boolean
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  findUserWithRoles(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({
      where,
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  async getUserInfo(where: Prisma.UserWhereUniqueInput) {
    const user = await this.findUserWithRoles(where)

    return this.transformUserInfo(user)
  }

  transformUserInfo(user: UserWithRolesAndPermissions): TransformedUserInfo {
    return {
      id: user.id,
      username: user.username,
      // roles: user.roles.map(item => item.roleId),
      permissions: user.roles.reduce((arr, item) => {
        item.role.permissions.forEach((permission) => {
          if (!arr.includes(permission.permission.code)) {
            arr.push(permission.permission.code)
          }
        })
        return arr
      }, [] as string[]),
      isAdmin: user.isAdmin,
    }
  }

  async register(user: RegisterUserDto) {
    const captcha = await this.cacheService.get(`captcha_${user.email}`)

    // console.log(`captcha_${user.email}`, captcha)
    if (!captcha) {
      throw new HttpException({ message: '验证码已失效' }, HttpStatus.GONE)
    }

    if (user.captcha !== captcha) {
      throw new HttpException({ message: '验证码不正确' }, HttpStatus.UNPROCESSABLE_ENTITY)
    }

    const foundUser = await this.prisma.user.findUnique({
      where: {
        username: user.username,
      },
    })

    if (foundUser) {
      throw new HttpException({ message: '用户已存在' }, HttpStatus.CONFLICT)
    }

    const newUser = {
      username: user.username,
      password: await hashPassword(user.password),
      email: user.email,
      nickName: user.nickName,
    }

    try {
      await this.prisma.user.create({
        data: newUser,
      })
      return { message: '注册成功' }
    }
    catch (e) {
      this.logger.error(e, UserService)
      return { message: '注册失败' }
    }
  }

  findUserDetailById(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    })
  }

  async updatePassword(id: number, passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.cacheService.get(`update_password_captcha_${passwordDto.email}`)

    if (!captcha) {
      throw new HttpException({ message: '验证码已失效' }, HttpStatus.UNPROCESSABLE_ENTITY)
    }

    if (passwordDto.captcha !== captcha) {
      throw new HttpException({ message: '验证码不正确' }, HttpStatus.BAD_REQUEST)
    }

    try {
      await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          password: await hashPassword(passwordDto.password),
        },
      })
      return { message: '密码修改成功' }
    }
    catch (e) {
      this.logger.error(e, UserService)
      return { message: '密码修改失败' }
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.cacheService.get(`update_user_captcha_${updateUserDto.email}`)

    if (!captcha) {
      throw new HttpException({ message: '验证码已失效' }, HttpStatus.UNPROCESSABLE_ENTITY)
    }

    if (updateUserDto.captcha !== captcha) {
      throw new HttpException({ message: '验证码不正确' }, HttpStatus.BAD_REQUEST)
    }

    const foundUser = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })

    if (!foundUser) {
      throw new HttpException({ message: '用户不存在' }, HttpStatus.NOT_FOUND)
    }

    const updateData: Prisma.UserUpdateInput = {}

    if (updateUserDto.nickName) {
      updateData.nickName = updateUserDto.nickName
    }
    if (updateUserDto.headPic) {
      updateData.headPic = updateUserDto.headPic
    }

    try {
      await this.prisma.user.update({
        where: {
          id,
        },
        data: updateData,
      })
      return { message: '用户信息修改成功' }
    }
    catch (e) {
      this.logger.error(e, UserService)
      return { message: '用户信息修改失败' }
    }
  }

  async freezeUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })
    if (!user) {
      throw new HttpException({ message: '用户不存在' }, HttpStatus.NOT_FOUND)
    }

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        isFrozen: true,
      },
    })
  }

  async findUsers(
    username: string,
    nickName: string,
    email: string,
    page: number,
    pageSize: number,
  ) {
    const skipCount = (page - 1) * pageSize

    const condition: Prisma.UserWhereInput = {}

    if (username) {
      condition.username = {
        contains: username,
      }
    }
    if (nickName) {
      condition.nickName = {
        contains: nickName,
      }
    }
    if (email) {
      condition.email = {
        contains: email,
      }
    }

    const [users, totalCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          nickName: true,
          email: true,
          phoneNumber: true,
          isFrozen: true,
          headPic: true,
          createTime: true,
        },
        skip: skipCount,
        take: pageSize,
        where: condition,
      }),
      this.prisma.user.count({
        where: condition,
      }),
    ])

    const vo = new UserListVo()

    vo.users = users
    vo.totalCount = totalCount
    return vo
  }
}

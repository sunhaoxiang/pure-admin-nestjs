import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '@/modules/prisma/prisma.service'
import { RedisService } from '@/modules/redis/redis.service'
import { md5 } from '@/utils'

import { LoginUserDto } from './dto/login-user.dto'
import { RegisterUserDto } from './dto/register-user.dto'
import { UpdateUserDto } from './dto/udpate-user.dto'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto'
import { LoginUserVo } from './vo/login-user.vo'
import { UserListVo } from './vo/user-list.vo'

@Injectable()
export class UserService {
  private logger = new Logger()

  @Inject(PrismaService)
  private prisma: PrismaService

  @Inject(RedisService)
  private redisService: RedisService

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`)

    console.log(`captcha_${user.email}`, captcha)
    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST)
    }

    if (user.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST)
    }

    const foundUser = await this.prisma.user.findUnique({
      where: {
        username: user.username
      }
    })

    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST)
    }

    const newUser = {
      username: user.username,
      password: md5(user.password),
      email: user.email,
      nickName: user.nickName
    }

    try {
      await this.prisma.user.create({
        data: newUser
      })
      return '注册成功'
    } catch (e) {
      this.logger.error(e, UserService)
      return '注册失败'
    }
  }

  async login(loginUserDto: LoginUserDto, isAdmin: boolean) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: loginUserDto.username,
        isAdmin
      },
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
    })

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
    }

    if (user.password !== md5(loginUserDto.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST)
    }

    const vo = new LoginUserVo()
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      headPic: user.headPic,
      createTime: user.createTime.getTime(),
      isFrozen: user.isFrozen,
      isAdmin: user.isAdmin,
      roles: user.roles.map(item => item.roleId),
      permissions: user.roles.reduce((arr, item) => {
        item.role.permissions.forEach(permission => {
          if (arr.indexOf(permission.permission.code) === -1) {
            arr.push(permission.permission.code)
          }
        })
        return arr
      }, [])
    }

    return vo
  }

  async findUserById(userId: number, isAdmin: boolean) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
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
    })

    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      roles: user.roles.map(item => item.roleId),
      permissions: user.roles.reduce((arr, item) => {
        item.role.permissions.forEach(permission => {
          if (arr.indexOf(permission.permission.code) === -1) {
            arr.push(permission.permission.code)
          }
        })
        return arr
      }, [])
    }
  }

  findUserDetailById(userId: number) {
    return this.prisma.user.findUnique({
      where: {
        id: userId
      }
    })
  }

  async updatePassword(userId: number, passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(`update_password_captcha_${passwordDto.email}`)

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST)
    }

    if (passwordDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST)
    }

    const foundUser = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    })

    foundUser.password = md5(passwordDto.password)

    try {
      await this.prisma.user.update({
        where: {
          id: userId
        },
        data: {
          password: md5(passwordDto.password)
        }
      })
      return '密码修改成功'
    } catch (e) {
      this.logger.error(e, UserService)
      return '密码修改失败'
    }
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(`update_user_captcha_${updateUserDto.email}`)

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST)
    }

    if (updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST)
    }

    const foundUser = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    })

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
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
          id: userId
        },
        data: updateData
      })
      return '用户信息修改成功'
    } catch (e) {
      this.logger.error(e, UserService)
      return '用户信息修改成功'
    }
  }

  async freezeUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id
      }
    })
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
    }

    await this.prisma.user.update({
      where: {
        id
      },
      data: {
        isFrozen: true
      }
    })
  }

  async findUsers(
    username: string,
    nickName: string,
    email: string,
    pageNo: number,
    pageSize: number
  ) {
    const skipCount = (pageNo - 1) * pageSize

    // const condition: Record<string, any> = {}
    //
    // if (username) {
    //   condition.username = Like(`%${username}%`)
    // }
    // if (nickName) {
    //   condition.nickName = Like(`%${nickName}%`)
    // }
    // if (email) {
    //   condition.email = Like(`%${email}%`)
    // }

    const condition: Prisma.UserWhereInput = {}

    if (username) {
      condition.username = {
        contains: username
      }
    }
    if (nickName) {
      condition.nickName = {
        contains: nickName
      }
    }
    if (email) {
      condition.email = {
        contains: email
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
          createTime: true
        },
        skip: skipCount,
        take: pageSize,
        where: {
          ...condition
        }
      }),
      this.prisma.user.count({
        where: {
          ...condition
        }
      })
    ])

    const vo = new UserListVo()

    vo.users = users
    vo.totalCount = totalCount
    return vo
  }
}

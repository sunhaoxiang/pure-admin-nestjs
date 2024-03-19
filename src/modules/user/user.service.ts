import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Prisma } from '@prisma/client'
import { Like, Repository } from 'typeorm'

import { PrismaService } from '@/modules/prisma/prisma.service'
import { RedisService } from '@/modules/redis/redis.service'
import { md5 } from '@/utils'

import { LoginUserDto } from './dto/login-user.dto'
import { RegisterUserDto } from './dto/register-user.dto'
import { UpdateUserDto } from './dto/udpate-user.dto'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto'
import { User } from './entities/user.entity'
import { LoginUserVo } from './vo/login-user.vo'
import { UserListVo } from './vo/user-list.vo'

@Injectable()
export class UserService {
  private logger = new Logger()

  @InjectRepository(User)
  private userRepository: Repository<User>

  @Inject(PrismaService)
  private prisma: PrismaService

  @Inject(RedisService)
  private redisService: RedisService

  async initData() {
    await this.prisma.user.create({
      data: {
        username: 'zhangsan',
        password: md5('111111'),
        email: 'xxx@xx.com',
        nickName: '张三',
        phoneNumber: '13233323333',
        isAdmin: true,
        roles: {
          create: {
            role: {
              create: {
                name: '管理员',
                permissions: {
                  create: {
                    permission: {
                      create: {
                        code: 'ccc',
                        description: '访问 ccc 接口'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  }

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
    const user = await this.userRepository.findOne({
      where: {
        username: loginUserDto.username,
        isAdmin
      },
      relations: ['roles', 'roles.permissions']
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
      roles: user.roles.map(item => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach(permission => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission)
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
    return this.userRepository.findOne({
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

    const foundUser = await this.userRepository.findOneBy({
      id: userId
    })

    foundUser.password = md5(passwordDto.password)

    try {
      await this.userRepository.save(foundUser)
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

    const foundUser = await this.userRepository.findOneBy({
      id: userId
    })

    if (updateUserDto.nickName) {
      foundUser.nickName = updateUserDto.nickName
    }
    if (updateUserDto.headPic) {
      foundUser.headPic = updateUserDto.headPic
    }

    try {
      await this.userRepository.save(foundUser)
      return '用户信息修改成功'
    } catch (e) {
      this.logger.error(e, UserService)
      return '用户信息修改成功'
    }
  }

  async freezeUserById(id: number) {
    const user = await this.userRepository.findOneBy({
      id
    })

    user.isFrozen = true

    await this.userRepository.save(user)
  }

  async findUsers(
    username: string,
    nickName: string,
    email: string,
    pageNo: number,
    pageSize: number
  ) {
    const skipCount = (pageNo - 1) * pageSize

    const condition: Record<string, any> = {}

    if (username) {
      condition.username = Like(`%${username}%`)
    }
    if (nickName) {
      condition.nickName = Like(`%${nickName}%`)
    }
    if (email) {
      condition.email = Like(`%${email}%`)
    }

    const [users, totalCount] = await this.userRepository.findAndCount({
      select: [
        'id',
        'username',
        'nickName',
        'email',
        'phoneNumber',
        'isFrozen',
        'headPic',
        'createTime'
      ],
      skip: skipCount,
      take: pageSize,
      where: condition
    })

    const vo = new UserListVo()

    vo.users = users
    vo.totalCount = totalCount
    return vo
  }
}

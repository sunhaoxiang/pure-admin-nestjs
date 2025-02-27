import { HttpException, HttpStatus, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

import { CacheService } from '@/modules/cache/cache.service'
import { MenuService } from '@/modules/menu/menu.service'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { JwtUserData } from '@/types'
import { createPaginationParams, createSingleFieldFilter, hashPassword, verifyPassword } from '@/utils'

import { CreateUserDto } from './dto/create-user.dto'
import { RegisterUserDto } from './dto/register-user.dto'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserListDto } from './dto/user-list.dto'

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly menuService: MenuService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { username, password, roles, ...rest } = createUserDto

    const isExist = await this.prisma.user.exists({
      where: { username },
    })

    if (isExist) {
      throw new HttpException({ message: '用户已存在' }, HttpStatus.CONFLICT)
    }

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        username,
        password: await hashPassword(password),
        roles: {
          create: roles.map(roleId => ({ roleId })),
        },
      },
    })

    return user
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { roles, ...rest } = updateUserDto

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        ...rest,
        roles: {
          deleteMany: {},
          create: roles.map(roleId => ({ roleId })),
        },
      },
    })
  }

  async delete(id: number) {
    return this.prisma.user.delete({
      where: {
        id,
      },
    })
  }

  async deleteMany(ids: number[]) {
    return this.prisma.user.deleteMany({
      where: {
        id: { in: ids },
      },
    })
  }

  async findMany(userListDto: UserListDto) {
    const { page, pageSize, username, nickName, email, phone } = userListDto

    const queryOptions: Prisma.UserFindManyArgs = {
      where: {
        ...createSingleFieldFilter({ field: 'username', value: username, isFuzzy: true }),
        ...createSingleFieldFilter({ field: 'nickName', value: nickName, isFuzzy: true }),
        ...createSingleFieldFilter({ field: 'email', value: email, isFuzzy: true }),
        ...createSingleFieldFilter({ field: 'phone', value: phone, isFuzzy: true }),
      },
      select: {
        id: true,
        username: true,
        nickName: true,
        email: true,
        phone: true,
        isFrozen: true,
        headPic: true,
        createTime: true,
        updateTime: true,
      },
    }

    const [list, total] = await this.prisma.getPaginatedList(
      this.prisma.user,
      queryOptions,
      createPaginationParams(page, pageSize),
    )

    return { list, total }
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        nickName: true,
        email: true,
        phone: true,
        headPic: true,
        isFrozen: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException()
    }

    const { roles, ...userData } = user
    const flattenedRoles = roles.map(item => item.role.id)

    return {
      ...userData,
      roles: flattenedRoles,
    }
  }

  findUser(args: Prisma.UserFindUniqueArgs) {
    return this.prisma.user.findUnique(args)
  }

  async validateUser(username: string, rawPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        isSuperAdmin: true,
        isFrozen: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      throw new UnauthorizedException({ message: '用户名或密码错误' })
    }

    const { password, isFrozen, roles, ...userData } = user

    if (!(await verifyPassword(rawPassword, password))) {
      throw new UnauthorizedException({ message: '用户名或密码错误' })
    }

    if (isFrozen) {
      throw new UnauthorizedException({ message: '用户已冻结' })
    }

    const { menuPermissions, featurePermissions } = await this.getUserPermissions(roles)

    return {
      ...userData,
      menuPermissions,
      featurePermissions,
    }
  }

  async getJwtPayloadData(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        isSuperAdmin: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException()
    }

    const { roles, ...userData } = user

    const { menuPermissions, featurePermissions } = await this.getUserPermissions(roles)

    return {
      ...userData,
      menuPermissions,
      featurePermissions,
    }
  }

  async getUserInfo(jwtUserData: JwtUserData) {
    const user = await this.findUser({
      where: { id: jwtUserData.id },
      select: {
        id: true,
        username: true,
        nickName: true,
        headPic: true,
        isSuperAdmin: true,
      },
    })

    const userMenu = await this.menuService.findUserMenuTree(jwtUserData)
    let menuPermissions: string[] = []
    let featurePermissions: string[] = []

    if (user.isSuperAdmin) {
      menuPermissions = ['*']
      featurePermissions = ['*']
    }
    else {
      menuPermissions = jwtUserData.menuPermissions
      featurePermissions = jwtUserData.featurePermissions
    }

    return {
      ...user,
      menus: userMenu,
      menuPermissions,
      featurePermissions,
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

  async getUserPermissions(roles: { role: Role }[]) {
    const menuSet = new Set<string>()
    const featureSet = new Set<string>()

    roles.forEach((item) => {
      item.role.menuPermissions.forEach(p => menuSet.add(p))
      item.role.featurePermissions.forEach(p => featureSet.add(p))
    })

    const menuPermissions = Array.from(menuSet)
    const featurePermissions = Array.from(featureSet)

    return { menuPermissions, featurePermissions }
  }
}

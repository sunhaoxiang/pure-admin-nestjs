import { ForbiddenException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { I18nService } from 'nestjs-i18n'
import { Logger } from 'winston'

import { MenuService } from '@/modules/menu/menu.service'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { JwtUserData } from '@/types'
import { createPaginationParams, createSingleFieldFilter, hashPassword, verifyPassword } from '@/utils'

import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserListDto } from './dto/user-list.dto'

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly menuService: MenuService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { username, password, roles, ...rest } = createUserDto

    const isExist = await this.prisma.user.exists({
      where: { username },
    })

    if (isExist) {
      throw new HttpException({ message: this.i18n.t('common.userExists') }, HttpStatus.CONFLICT)
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

  async updatePassword(id: number, updateUserPasswordDto: UpdateUserPasswordDto) {
    const { oldPassword, newPassword } = updateUserPasswordDto

    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException()
    }

    if (!(await verifyPassword(oldPassword, user.password))) {
      throw new ForbiddenException({ message: this.i18n.t('common.oldPasswordError') })
    }

    await this.prisma.user.update({
      where: { id },
      data: { password: await hashPassword(newPassword) },
    })

    return { message: this.i18n.t('common.passwordUpdated') }
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
        isSuperAdmin: false,
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
      throw new ForbiddenException({ message: this.i18n.t('common.usernameOrPasswordError') })
    }

    const { password, isFrozen, roles, ...userData } = user

    if (!(await verifyPassword(rawPassword, password))) {
      throw new ForbiddenException({ message: this.i18n.t('common.usernameOrPasswordError') })
    }

    if (isFrozen) {
      throw new ForbiddenException({ message: this.i18n.t('common.userFrozen') })
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

    const { menuPermissions, featurePermissions, apiPermissions } = await this.getUserPermissions(roles)

    return {
      ...userData,
      menuPermissions,
      featurePermissions,
      apiPermissions,
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
    let apiPermissions: string[] = []

    if (user.isSuperAdmin) {
      menuPermissions = ['*']
      featurePermissions = ['*']
      apiPermissions = ['*']
    }
    else {
      menuPermissions = jwtUserData.menuPermissions
      featurePermissions = jwtUserData.featurePermissions
      apiPermissions = jwtUserData.apiPermissions
    }

    return {
      ...user,
      menus: userMenu,
      menuPermissions,
      featurePermissions,
      apiPermissions,
    }
  }

  async freezeUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })
    if (!user) {
      throw new HttpException({ message: this.i18n.t('common.userNotFound') }, HttpStatus.NOT_FOUND)
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
    const apiSet = new Set<string>()
    roles.forEach((item) => {
      item.role.menuPermissions.forEach(p => menuSet.add(p))
      item.role.featurePermissions.forEach(p => featureSet.add(p))
      item.role.apiPermissions.forEach(p => apiSet.add(p))
    })

    const menuPermissions = Array.from(menuSet)
    const featurePermissions = Array.from(featureSet)
    const apiPermissions = Array.from(apiSet)

    return { menuPermissions, featurePermissions, apiPermissions }
  }
}

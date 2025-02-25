import { Injectable } from '@nestjs/common'
import { Menu, MenuType, Prisma } from '@prisma/client'

import { PrismaService } from '@/modules/prisma/prisma.service'
import { convertFlatDataToTree, createQueryFilter, TreeNode } from '@/utils'

import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.menu.findMany()
  }

  async findMenuTree() {
    const menus = await this.findAll()
    const menuTree = convertFlatDataToTree<TreeNode<Menu>>(menus)

    return menuTree
  }

  findFlatMenuTree() {
    return this.findAll()
  }

  async findMenuById(id: number) {
    return this.prisma.menu.findUnique({
      where: { id },
    })
  }

  create(createMenuDto: CreateMenuDto) {
    return this.prisma.menu.create({
      data: createMenuDto,
    })
  }

  update(id: number, updateMenuDto: UpdateMenuDto) {
    return this.prisma.menu.update({
      where: { id },
      data: updateMenuDto,
    })
  }

  delete(id: number) {
    return this.prisma.menu.delete({
      where: { id },
    })
  }

  findPermissionMenus(type: MenuType) {
    const queryOptions: Prisma.MenuFindManyArgs = {
      where: {
        ...createQueryFilter({ field: 'type', value: type }),
      },
    }

    return this.prisma.menu.findMany(queryOptions)
  }
}

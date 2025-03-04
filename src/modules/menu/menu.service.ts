import { Injectable } from '@nestjs/common'
import { Menu, MenuType, Prisma } from '@prisma/client'

import { PrismaService } from '@/modules/prisma/prisma.service'
import { JwtUserData } from '@/types'
import { convertFlatDataToTree, createSingleFieldFilter, TreeNode } from '@/utils'

import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async findMenuTree() {
    const menus = await this.prisma.menu.findMany()
    const menuTree = convertFlatDataToTree<TreeNode<Menu>>(menus)

    return menuTree
  }

  findFlatMenuTree() {
    return this.prisma.menu.findMany()
  }

  async findMenuById(id: number) {
    return this.prisma.menu.findUnique({
      where: { id },
    })
  }

  async findUserMenuTree(jwtUserData: JwtUserData) {
    const baseCondition = {
      type: {
        not: MenuType.FEATURE,
      },
    }

    const whereCondition = jwtUserData.isSuperAdmin
      ? baseCondition
      : {
          ...baseCondition,
          OR: [
            { code: null },
            { code: '' },
            { code: { in: jwtUserData.menuPermissions } },
          ],
        }

    const menus = await this.prisma.menu.findMany({
      where: whereCondition,
    })

    const menuTree = convertFlatDataToTree<TreeNode<Menu>>(menus)

    return this.filterEmptyDirectories(menuTree)
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
        NOT: [
          { code: null },
          { code: '' },
        ],
        ...createSingleFieldFilter({ field: 'type', value: type }),
      },
    }

    return this.prisma.menu.findMany(queryOptions)
  }

  filterEmptyDirectories(nodes: TreeNode<Menu>[]) {
    return nodes.filter((node) => {
      if (node.children && node.children.length > 0) {
        node.children = this.filterEmptyDirectories(node.children)
      }

      // 保留非 DIRECTORY 类型的节点，或有子节点的 DIRECTORY
      return node.type !== MenuType.DIRECTORY
        || (node.children && node.children.length > 0)
    })
  }
}

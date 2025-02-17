import { Injectable } from '@nestjs/common'
import { Menu } from '@prisma/client'

import { PrismaService } from '@/modules/prisma/prisma.service'
import { convertFlatDataToTree, TreeNode } from '@/utils'

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

  create(createMenuDto: CreateMenuDto) {
    console.log(createMenuDto)
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
}

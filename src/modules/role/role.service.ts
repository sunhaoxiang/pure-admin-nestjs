import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '@/modules/prisma/prisma.service'
import { createFuzzySearchFilter, createPaginationParams } from '@/utils'

import { CreateRoleDto } from './dto/create-role.dto'
import { RoleListDto } from './dto/role-list.dto'
import { UpdateRoleDto } from './dto/update-role.dto'

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(roleListDto: RoleListDto) {
    const { page, pageSize, name, code } = roleListDto

    const queryOptions: Prisma.RoleFindManyArgs = {
      where: {
        ...createFuzzySearchFilter('name', name),
        ...createFuzzySearchFilter('code', code),
      },
    }

    const [list, total] = await this.prisma.getPaginatedList(
      this.prisma.role,
      queryOptions,
      createPaginationParams(page, pageSize),
    )

    return { list, total }
  }

  async findOne(id: number) {
    return this.prisma.role.findUnique({
      where: { id },
    })
  }

  create(createRoleDto: CreateRoleDto) {
    return this.prisma.role.create({
      data: createRoleDto,
    })
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    })
  }

  delete(id: number) {
    return this.prisma.role.delete({
      where: { id },
    })
  }

  deleteMany(ids: number[]) {
    return this.prisma.role.deleteMany({
      where: { id: { in: ids } },
    })
  }
}

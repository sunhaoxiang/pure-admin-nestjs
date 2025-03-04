import { Injectable } from '@nestjs/common'
import { Api, ApiType, Prisma } from '@prisma/client'

import { PrismaService } from '@/modules/prisma/prisma.service'
import { convertFlatDataToTree, createSingleFieldFilter, TreeNode } from '@/utils'

import { CreateApiDto } from './dto/create-api.dto'
import { UpdateApiDto } from './dto/update-api.dto'

@Injectable()
export class ApiService {
  constructor(private readonly prisma: PrismaService) {}

  async findApiTree() {
    const apis = await this.prisma.api.findMany()
    const apiTree = convertFlatDataToTree<TreeNode<Api>>(apis)

    return apiTree
  }

  findFlatApiTree() {
    return this.prisma.api.findMany()
  }

  findApiById(id: number) {
    return this.prisma.api.findUnique({
      where: { id },
    })
  }

  findPermissionApis() {
    const queryOptions: Prisma.ApiFindManyArgs = {
      where: {
        NOT: [
          { code: null },
          { code: '' },
        ],
        type: 'API',
      },
    }

    return this.prisma.api.findMany(queryOptions)
  }

  create(createApiDto: CreateApiDto) {
    return this.prisma.api.create({
      data: createApiDto,
    })
  }

  update(id: number, updateApiDto: UpdateApiDto) {
    return this.prisma.api.update({
      where: { id },
      data: updateApiDto,
    })
  }

  delete(id: number) {
    return this.prisma.api.delete({
      where: { id },
    })
  }
}

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { ExtendedPrismaClient } from './extended-client'

interface PageArgs {
  page: number
  pageSize: number
}

// https://github.com/prisma/prisma/issues/18628#issuecomment-1975271421
@Injectable()
export class PrismaService extends ExtendedPrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      // log: [
      //   {
      //     emit: 'stdout',
      //     level: 'query',
      //   },
      // ],
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  /**
   * 获取分页列表
   * @param model 模型
   * @param args 查询参数
   * @param pageArgs 分页参数
   * @returns 列表和总数
   */
  async getPaginatedList<
    TModel,
    TArgs extends Prisma.Args<TModel, 'findMany'>,
    TReturnType extends Prisma.Result<TModel, TArgs, 'findMany'>,
  >(
    model: TModel,
    args: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findMany'>>,
    pageArgs: PageArgs,
  ): Promise<[TReturnType, number]> {
    const { page, pageSize } = pageArgs

    const allArgs = {
      ...args,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }

    const [list, total] = await (model as any).findManyAndCount(allArgs)

    return [list, total]
  }
}

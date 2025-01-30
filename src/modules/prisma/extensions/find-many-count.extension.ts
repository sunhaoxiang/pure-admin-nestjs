import { Prisma } from '@prisma/client'

export const findManyAndCountExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'findManyAndCount',
    model: {
      $allModels: {
        async findManyAndCount<
          TModel,
          TArgs extends Prisma.Args<TModel, 'findMany'>,
          TReturnType = Prisma.Result<TModel, TArgs, 'findMany'>,
        >(
          this: TModel,
          args?: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findMany'>>,
        ): Promise<[TReturnType, number]> {
          const context = Prisma.getExtensionContext(this)

          const [records, totalRecords] = await client.$transaction([
            (context as any).findMany(args),
            (context as any).count({ where: (args as any)?.where }),
          ])

          return [records, totalRecords]
        },
      },
    },
  })
})

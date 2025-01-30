import { Prisma } from '@prisma/client'

export const existsExtension = Prisma.defineExtension({
  name: 'exists',
  model: {
    $allModels: {
      async exists<TModel, TArgs extends Prisma.Args<TModel, 'findUniqueOrThrow'>>(
        this: TModel,
        args?: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findUniqueOrThrow'>>,
      ): Promise<boolean> {
        const context = Prisma.getExtensionContext(this)

        try {
          await (context as any).findUniqueOrThrow(args)
          return true
        }
        catch {
          return false
        }
      },
    },
  },
})

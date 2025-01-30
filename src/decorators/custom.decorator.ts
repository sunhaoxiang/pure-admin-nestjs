import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import { FastifyRequest } from 'fastify'

export function RequirePermission(...permissions: string[]) {
  return SetMetadata('require-permission', permissions)
}

export const UserInfo = createParamDecorator((propertyKey: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>()

  if (!request.user) {
    return null
  }

  return propertyKey ? request.user[propertyKey] : request.user
})

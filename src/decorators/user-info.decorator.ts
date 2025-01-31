import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { FastifyRequest } from 'fastify'

export const UserInfo = createParamDecorator((propertyKey: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>()

  if (!request.user) {
    return null
  }

  return propertyKey ? request.user[propertyKey] : request.user
})

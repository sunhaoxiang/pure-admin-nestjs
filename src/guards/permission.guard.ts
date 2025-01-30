import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest<FastifyRequest>()

    if (!request.user) {
      return true
    }

    const { permissions } = request.user

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('require-permission', [
      context.getClass(),
      context.getHandler(),
    ])

    if (!requiredPermissions) {
      return true
    }

    for (let i = 0; i < requiredPermissions.length; i++) {
      const curPermission = requiredPermissions[i]
      const found = permissions.find(item => item === curPermission)
      if (!found) {
        throw new UnauthorizedException('您没有访问该接口的权限')
      }
    }

    return true
  }
}

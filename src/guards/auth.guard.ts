import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport'
import { FastifyRequest } from 'fastify'

import { IS_PUBLIC_KEY, IS_REFRESH_KEY, PERMISSIONS_KEY } from '@/decorators'

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
  ) {
    super()
  }

  async canActivate(context: ExecutionContext) {
    // 检查是否是公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    try {
      // 进行 jwt 认证
      const isAuthenticated = await super.canActivate(context)

      if (!isAuthenticated) {
        throw new UnauthorizedException('Token 失效，请重新登录')
      }

      const isRefresh = this.reflector.get<boolean>(IS_REFRESH_KEY, context.getHandler())
      const request = context.switchToHttp().getRequest<FastifyRequest>()

      if (!isRefresh && request.user.tokenType !== 'access') {
        throw new UnauthorizedException('refreshToken 只能用于刷新接口')
      }

      if (request.user.isSuperAdmin) {
        return true
      }

      const requiredApiPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getClass(),
        context.getHandler(),
      ])

      if (requiredApiPermissions.length === 0) {
        return true
      }

      const userApiPermissions = request.user.apiPermissions

      const hasAllPermissions = requiredApiPermissions.every(permission => userApiPermissions.includes(permission))

      if (!hasAllPermissions) {
        throw new ForbiddenException('您没有访问该接口的权限')
      }

      return true
    }
    catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('accessToken 不能用于刷新接口')
      }

      throw error
    }
  }
}

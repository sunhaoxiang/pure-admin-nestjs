import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport'
import { FastifyRequest } from 'fastify'

import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from '@/decorators'
import { AuthService } from '@/modules/auth/auth.service'

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
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

    // 进行 jwt 认证
    const isAuthenticated = await super.canActivate(context)

    if (!isAuthenticated) {
      throw new UnauthorizedException('Token 失效，请重新登录')
    }

    // const httpContext = context.switchToHttp()
    // const request = httpContext.getRequest<FastifyRequest>()

    // const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
    //   context.getClass(),
    //   context.getHandler(),
    // ])

    // const userAuthorizationInfo = await this.authService.getUserAuthorizationInfo(request.user.id)

    // if (requiredPermissions.length === 0 || userAuthorizationInfo.isAdmin) {
    //   return true
    // }

    // // 进行权限认证
    // const userPermissions = userAuthorizationInfo.permissions

    // const hasAllPermissions = requiredPermissions.every(permission => userPermissions.includes(permission))

    // if (!hasAllPermissions) {
    //   throw new ForbiddenException('您没有访问该接口的权限')
    // }

    return true
  }
}

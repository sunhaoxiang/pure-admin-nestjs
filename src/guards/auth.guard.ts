import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport'
import { FastifyRequest } from 'fastify'
import { I18nService } from 'nestjs-i18n'

import { IS_PUBLIC_KEY, IS_REFRESH_KEY, PERMISSIONS_KEY } from '@/decorators'

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly i18n: I18nService,
  ) {
    super()
  }

  async canActivate(context: ExecutionContext) {
    // 检查是否是公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? false

    if (isPublic) {
      return true
    }

    try {
      // 进行 jwt 认证
      const isAuthenticated = await super.canActivate(context)

      if (!isAuthenticated) {
        throw new UnauthorizedException(this.i18n.t('common.tokenExpired'))
      }

      const isRefresh = this.reflector.get<boolean | undefined>(IS_REFRESH_KEY, context.getHandler()) ?? false
      const request = context.switchToHttp().getRequest<FastifyRequest>()

      if (!isRefresh && request.user.tokenType !== 'access') {
        throw new UnauthorizedException(this.i18n.t('common.refreshTokenOnly'))
      }

      if (request.user.isSuperAdmin) {
        return true
      }

      const requiredApiPermissions = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
        context.getClass(),
        context.getHandler(),
      ]) ?? []

      if (requiredApiPermissions.length === 0) {
        return true
      }

      const userApiPermissions = request.user.apiPermissions

      const hasAllPermissions = requiredApiPermissions.every(permission => userApiPermissions.includes(permission))

      if (!hasAllPermissions) {
        throw new ForbiddenException(this.i18n.t('common.noPermission'))
      }

      return true
    }
    catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(this.i18n.t('common.accessTokenOnly'))
      }

      throw error
    }
  }
}

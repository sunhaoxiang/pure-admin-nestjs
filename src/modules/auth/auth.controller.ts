import {
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { AuthGuard } from '@nestjs/passport'
import { FastifyRequest } from 'fastify'

import { Public } from '@/decorators'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: FastifyRequest) {
    const accessToken = this.jwtService.sign(
      {
        id: req.user.id,
        username: req.user.username,
        roles: req.user.roles,
        permissions: req.user.permissions,
      },
      {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES') || '30m',
      },
    )

    const refreshToken = this.jwtService.sign(
      {
        id: req.user.id,
      },
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES') || '7d',
      },
    )

    return {
      userInfo: req.user,
      accessToken,
      refreshToken,
    }
  }
}

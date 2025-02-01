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
import { CacheService } from '@/modules/cache/cache.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
  ) {}

  @Public()
  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: FastifyRequest) {
    const token = this.jwtService.sign(
      req.user,
      {
        expiresIn: this.configService.get('JWT_EXPIRES') || '30m',
      },
    )

    const refreshToken = this.jwtService.sign(
      req.user,
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES') || '7d',
      },
    )

    return {
      token,
      refreshToken,
    }
  }
}

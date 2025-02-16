import { Module } from '@nestjs/common'

import { UserModule } from '@/modules/user/user.module'

import { JwtStrategy } from './strategy/jwt.strategy'
import { LocalStrategy } from './strategy/local.strategy'

@Module({
  imports: [UserModule],
  providers: [LocalStrategy, JwtStrategy],
})
export class AuthModule {}

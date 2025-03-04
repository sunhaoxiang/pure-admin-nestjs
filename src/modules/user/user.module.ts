import { Module } from '@nestjs/common'

import { ApiModule } from '@/modules/api/api.module'
import { MenuModule } from '@/modules/menu/menu.module'

import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [MenuModule, ApiModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

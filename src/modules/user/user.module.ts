import { Module } from '@nestjs/common'

import { MenuModule } from '@/modules/menu/menu.module'

import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [MenuModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

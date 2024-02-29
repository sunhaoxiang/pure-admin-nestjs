import { Module } from '@nestjs/common'

import { TypeOrmModule } from '@nestjs/typeorm'

import { Permission } from './entities/permission.entity'
import { Role } from './entities/role.entity'
import { User } from './entities/user.entity'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission])],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}

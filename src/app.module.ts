import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EmailModule } from './email/email.module'
import { RedisModule } from './redis/redis.module'
import { Permission } from './user/entities/permission.entity'
import { Role } from './user/entities/role.entity'
import { User } from './user/entities/user.entity'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '123456',
      database: 'a-admin-nest',
      synchronize: true,
      logging: true,
      entities: [User, Role, Permission],
      poolSize: 10,
      connectorPackage: 'mysql2',
      extra: {
        authPlugin: 'sha256_password'
      }
    }),
    UserModule,
    RedisModule,
    EmailModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { getEnvPath } from './common/helper'
import { EmailModule } from './email/email.module'
import { LoginGuard } from './login.guard'
import { PermissionGuard } from './permission.guard'
import { RedisModule } from './redis/redis.module'
import { Permission } from './user/entities/permission.entity'
import { Role } from './user/entities/role.entity'
import { User } from './user/entities/user.entity'
import { UserModule } from './user/user.module'

const envFilePath: string = getEnvPath(`${__dirname}/common/env`)

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [envFilePath],
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      useFactory(configService: ConfigService) {
        return {
          type: 'mysql',
          host: configService.get('DB_SERVER_HOST'),
          port: configService.get('DB_SERVER_PORT'),
          username: configService.get('DB_SERVER_USERNAME'),
          password: configService.get('DB_SERVER_PASSWORD'),
          database: configService.get('DB_SERVER_DATABASE'),
          synchronize: true,
          logging: true,
          entities: [User, Role, Permission],
          poolSize: 10,
          connectorPackage: 'mysql2',
          extra: {
            authPlugin: 'sha256_password'
          }
        }
      },
      inject: [ConfigService]
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '30m' // 默认 30 分钟
          }
        }
      },
      inject: [ConfigService]
    }),
    UserModule,
    RedisModule,
    EmailModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoginGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard
    }
  ]
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { getEnvPath } from './common/helper'
import { dbConfig, jwtConfig, redisConfig } from './config'
import { EmailModule } from './email/email.module'
import { LoginGuard } from './login.guard'
import { PermissionGuard } from './permission.guard'
import { RedisModule } from './redis/redis.module'
import { UserModule } from './user/user.module'

const envFilePath: string = getEnvPath(`${__dirname}/common/env`)

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [envFilePath],
      isGlobal: true,
      load: [dbConfig, redisConfig, jwtConfig]
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.get('db'))
      })
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.get('redis'))
      })
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.get('jwt'))
      })
    }),
    UserModule,
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

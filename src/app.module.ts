import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

import { dbConfig, jwtConfig, nodemailerConfig, redisConfig } from '@/config'
import { LoginGuard } from '@/guards/login.guard'
import { PermissionGuard } from '@/guards/permission.guard'
import { NodemailerModule } from '@/modules/nodemailer/nodemailer.module'
import { RedisModule } from '@/modules/redis/redis.module'
import { UserModule } from '@/modules/user/user.module'
import { getEnvPath } from '@/utils'

import { AppController } from './app.controller'
import { AppService } from './app.service'

const envFilePath: string = getEnvPath(`${__dirname}/env`)

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [envFilePath],
      isGlobal: true,
      load: [dbConfig, redisConfig, nodemailerConfig, jwtConfig]
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
    NodemailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.get('nodemailer'))
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
    UserModule
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

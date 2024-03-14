import { Module, ValidationPipe } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

import { dbConfig, jwtConfig, nodemailerConfig, redisConfig } from '@/config'
import { CustomExceptionFilter } from '@/filters/custom-exception.filter'
import { LoginGuard } from '@/guards/login.guard'
import { PermissionGuard } from '@/guards/permission.guard'
import { FormatResponseInterceptor } from '@/interceptors/format-response.interceptor'
import { InvokeRecordInterceptor } from '@/interceptors/invoke-record.interceptor'
import { NodemailerModule } from '@/modules/nodemailer/nodemailer.module'
import { RedisModule } from '@/modules/redis/redis.module'
import { UserModule } from '@/modules/user/user.module'

import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.local', '.env.dev', 'env.test', '.env.prod'],
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
      useClass: LoginGuard // 登录守卫
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard // 权限守卫
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: FormatResponseInterceptor // 格式化响应拦截器
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: InvokeRecordInterceptor // 调用记录拦戫器
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe // 全局管道
    },
    {
      provide: APP_FILTER,
      useClass: CustomExceptionFilter // 自定义异常过滤器
    }
  ]
})
export class AppModule {}

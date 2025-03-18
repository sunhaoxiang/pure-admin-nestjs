import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'winston-daily-rotate-file'
import { WinstonModule } from 'nest-winston'
import { HeaderResolver, I18nModule, I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n'
import path from 'node:path'
import winston from 'winston'

import config from '@/configs'
import { AllExceptionsFilter, HttpExceptionFilter } from '@/filters'
import { AuthGuard } from '@/guards'
import { FormatResponseInterceptor, InvokeRecordInterceptor } from '@/interceptors'
import { ExampleInterceptor } from '@/interceptors/example.interceptor'
import { ApiModule } from '@/modules/api/api.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { CacheModule } from '@/modules/cache/cache.module'
import { MenuModule } from '@/modules/menu/menu.module'
import { NodemailerModule } from '@/modules/nodemailer/nodemailer.module'
import { PrismaModule } from '@/modules/prisma/prisma.module'
import { RoleModule } from '@/modules/role/role.module'
import { UserModule } from '@/modules/user/user.module'
import { createLoggerOptions, defaultLogFormat, getEnvPath } from '@/utils'

import { AppController } from './app.controller'
import { AppService } from './app.service'

// 设置默认时区为东八区
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')

const envFilePath = getEnvPath(__dirname)

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [envFilePath, '.env'],
      isGlobal: true,
      load: [...config],
    }),
    ScheduleModule.forRoot(),
    PrismaModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.get('database')),
      }),
    }),
    CacheModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.get('redis')),
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.get('jwt')),
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ([
        ...(await configService.get('throttler')),
      ]),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en-US',
      loaderOptions: {
        path: path.join(__dirname, '/locales/'),
        watch: true,
      },
      resolvers: [new HeaderResolver(['x-lang'])],
      typesOutputPath: path.join(__dirname, '/generated/i18n.generated.ts'),
    }),
    NodemailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.get('nodemailer')),
      }),
    }),
    // WinstonModule.forRoot({
    //   level: 'http',
    //   transports: [
    //     new winston.transports.Console({
    //       format: defaultLogFormat(),
    //     }),
    //     new winston.transports.DailyRotateFile({
    //       ...createLoggerOptions('http', logDir),
    //       format: defaultLogFormat(true, 'http'),
    //     }),
    //     new winston.transports.DailyRotateFile({
    //       ...createLoggerOptions('info', logDir),
    //       format: defaultLogFormat(true, 'info'),
    //     }),
    //     new winston.transports.DailyRotateFile({
    //       ...createLoggerOptions('error', logDir),
    //       format: defaultLogFormat(true, 'error'),
    //     }),
    //   ],
    //   exceptionHandlers: [
    //     new winston.transports.DailyRotateFile({
    //       ...createLoggerOptions('exception', logDir),
    //       format: defaultLogFormat(),
    //     }),
    //   ],
    // }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logDir = configService.get<string>('NEST_LOG_DIR', 'log')

        return {
          level: 'http',
          transports: [
            new winston.transports.Console({
              format: defaultLogFormat(),
            }),
            new winston.transports.DailyRotateFile({
              ...createLoggerOptions('http', logDir),
              format: defaultLogFormat(true, 'http'),
            }),
            new winston.transports.DailyRotateFile({
              ...createLoggerOptions('info', logDir),
              format: defaultLogFormat(true, 'info'),
            }),
            new winston.transports.DailyRotateFile({
              ...createLoggerOptions('error', logDir),
              format: defaultLogFormat(true, 'error'),
            }),
          ],
          exceptionHandlers: [
            new winston.transports.DailyRotateFile({
              ...createLoggerOptions('exception', logDir),
              format: defaultLogFormat(),
            }),
          ],
        }
      },
    }),
    AuthModule,
    UserModule,
    RoleModule,
    MenuModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigService,

    // -------------------- 请求处理流程 --------------------
    //    请求
    //     ↓
    //    中间件 (Middlewares) [自上而下按顺序执行]
    //     ↓
    //    守卫 (Guards) [自上而下按顺序执行]
    //     ↓
    //    拦截器 (Interceptors) [自上而下按顺序执行] (请求阶段)
    //     ↓
    //    管道 (Pipes) [自上而下按顺序执行]
    //     ↓
    //    路由处理器 (Route Handler)
    //     ↓
    //    拦截器 (Interceptors) [自下而上按顺序执行] (响应阶段)
    //     ↓
    //    异常过滤器 (Exception Filters) [自下而上按顺序执行]
    //     ↓
    //    响应

    // -------------------- Guards --------------------
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // 限流守卫
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // 权限守卫
    },

    // -------------------- Interceptors --------------------
    {
      provide: APP_INTERCEPTOR,
      useClass: ExampleInterceptor, // 示例拦截器，仅在示例项目中使用，正式项目不要使用！
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: InvokeRecordInterceptor, // 调用记录拦截器
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: FormatResponseInterceptor, // 格式化响应拦截器
    },

    // -------------------- Pipes --------------------
    {
      provide: APP_PIPE,
      useValue: new I18nValidationPipe({
        transform: true,
        whitelist: true,
        validateCustomDecorators: true,
        skipMissingProperties: false,
        stopAtFirstError: true,
        disableErrorMessages: false,
      }), // 数据验证管道
    },

    // -------------------- Exceptions Filters --------------------
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter, // 所有异常过滤器， 用于捕获除 HttpException 之外的异常
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // Http 异常过滤器
    },
    {
      provide: APP_FILTER,
      useFactory: () => new I18nValidationExceptionFilter({ // 国际化异常过滤器
        detailedErrors: false,
      }),
    },
  ],
})
export class AppModule {}

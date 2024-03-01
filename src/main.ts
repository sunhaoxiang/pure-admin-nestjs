import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { CustomExceptionFilter } from './custom-exception.filter'
import { FormatResponseInterceptor } from './format-response.interceptor'
import { InvokeRecordInterceptor } from './invoke-record.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalInterceptors(new FormatResponseInterceptor())
  app.useGlobalInterceptors(new InvokeRecordInterceptor())
  app.useGlobalFilters(new CustomExceptionFilter())

  const configService = app.get(ConfigService)
  await app.listen(configService.get('NEST_SERVER_PORT'))
}

bootstrap()

import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { CustomExceptionFilter } from '@/filters/custom-exception.filter'
import { FormatResponseInterceptor } from '@/interceptors/format-response.interceptor'
import { InvokeRecordInterceptor } from '@/interceptors/invoke-record.interceptor'
import { AppModule } from '@/modules/app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalInterceptors(new FormatResponseInterceptor())
  app.useGlobalInterceptors(new InvokeRecordInterceptor())
  app.useGlobalFilters(new CustomExceptionFilter())

  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle('Easy Admin')
    .setDescription('api 接口文档')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      description: '基于 jwt 的认证'
    })
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-doc', app, document)

  const configService = app.get(ConfigService)
  await app.listen(configService.get('NEST_SERVER_PORT'))
}

bootstrap()

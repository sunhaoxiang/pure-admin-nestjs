import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

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

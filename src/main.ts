import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'

import { AppModule } from './app.module'

async function bootstrap() {
  // use fastify adapter
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      // allow cross-origin
      cors: true,
      // only show error and warn log
      logger: ['error', 'warn']
    }
  )
  // set global prefix
  app.setGlobalPrefix('api')
  await app.listen(3000, () => {
    console.log('api: http://localhost:3000')
  })
}
bootstrap()

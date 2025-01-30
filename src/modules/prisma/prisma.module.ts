import { DynamicModule, Global, Module, Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaService } from './prisma.service'

interface PrismaConfig {
  url: string
}

export interface PrismaModuleOptions {
  useFactory?: (...args: any[]) => Promise<PrismaConfig> | PrismaConfig
  inject?: any[]
  imports?: any[]
  extraProviders?: Provider[]
}

@Global()
@Module({})
export class PrismaModule {
  static forRootAsync(prismaModuleOptions: PrismaModuleOptions): DynamicModule {
    const databaseUrlProvider = {
      provide: 'DATABASE_URL',
      async useFactory(configService: ConfigService) {
        const options = await prismaModuleOptions.useFactory(configService)
        return options.url
      },
      inject: prismaModuleOptions.inject || [],
    }

    return {
      module: PrismaModule,
      imports: prismaModuleOptions.imports || [],
      providers: [
        databaseUrlProvider,
        PrismaService,
        ...(prismaModuleOptions.extraProviders ?? []),
      ],
      exports: [PrismaService],
    }
  }
}

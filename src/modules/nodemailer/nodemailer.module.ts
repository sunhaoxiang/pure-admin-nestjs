import { DynamicModule, Global, Module, Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createTransport } from 'nodemailer'

import { NodemailerService } from './nodemailer.service'

interface NodemailerConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface NodemailerModuleOptions {
  useFactory?: (...args: any[]) => Promise<NodemailerConfig> | NodemailerConfig
  inject?: any[]
  imports?: any[]
  extraProviders?: Provider[]
}

@Global()
@Module({})
export class NodemailerModule {
  static forRootAsync(nodemailerModuleOptions: NodemailerModuleOptions): DynamicModule {
    const nodemailerTransporterProvider = {
      provide: 'NODEMAILER_TRANSPORTER',
      async useFactory(configService: ConfigService) {
        const options = await nodemailerModuleOptions.useFactory(configService)
        return createTransport(options)
      },
      inject: nodemailerModuleOptions.inject || [],
    }

    return {
      module: NodemailerModule,
      imports: nodemailerModuleOptions.imports || [],
      providers: [
        nodemailerTransporterProvider,
        NodemailerService,
        ...(nodemailerModuleOptions.extraProviders ?? []),
      ],
      exports: [NodemailerService],
    }
  }
}

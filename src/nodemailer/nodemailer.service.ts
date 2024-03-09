import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Transporter } from 'nodemailer'

@Injectable()
export class NodemailerService {
  @Inject('NODEMAILER_TRANSPORTER')
  private transporter: Transporter

  @Inject(ConfigService)
  private configService: ConfigService

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: {
        name: 'Easy Admin',
        address: this.configService.get('NODEMAILER_AUTH_USER')
      },
      to,
      subject,
      html
    })
  }
}

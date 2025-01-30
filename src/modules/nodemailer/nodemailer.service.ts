import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Transporter } from 'nodemailer'

@Injectable()
export class NodemailerService {
  constructor(
    private readonly configService: ConfigService,
    @Inject('NODEMAILER_TRANSPORTER') private readonly transporter: Transporter,
  ) {}

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: {
        name: 'Pure Admin',
        address: this.configService.get('NODEMAILER_USER'),
      },
      to,
      subject,
      html,
    })
  }
}

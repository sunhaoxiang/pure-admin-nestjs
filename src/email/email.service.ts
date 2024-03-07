import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createTransport, Transporter } from 'nodemailer'

@Injectable()
export class EmailService {
  transporter: Transporter

  constructor(private configService: ConfigService) {
    this.transporter = createTransport({
      host: this.configService.get('NODEMAILER_HOST'),
      port: this.configService.get('NODEMAILER_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('NODEMAILER_AUTH_USER'),
        pass: this.configService.get('NODEMAILER_AUTH_PASSWORD')
      }
    })
  }

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

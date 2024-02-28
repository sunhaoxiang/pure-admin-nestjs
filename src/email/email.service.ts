import { Injectable } from '@nestjs/common'
import { createTransport, Transporter } from 'nodemailer'

@Injectable()
export class EmailService {
  transporter: Transporter

  constructor() {
    this.transporter = createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: '邮箱地址占位',
        pass: '授权码占位'
      }
    })
  }

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: {
        name: 'A Admin',
        address: '邮箱地址占位'
      },
      to,
      subject,
      html
    })
  }
}

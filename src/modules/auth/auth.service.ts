import { Injectable, UnauthorizedException } from '@nestjs/common'

import { UserService } from '@/modules/user/user.service'
import { verifyPassword } from '@/utils'

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateUser(username: string, rawPassword: string) {
    const user = await this.userService.findUserWithRoles({ username })

    if (!user || !(await verifyPassword(rawPassword, user.password))) {
      throw new UnauthorizedException({ message: '用户名或密码错误' })
    }

    return this.userService.transformUserInfo(user)
  }
}

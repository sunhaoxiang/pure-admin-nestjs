import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  Inject,
  Post,
  Query,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { ApiBearerAuth, ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'

import { RequireLogin, UserInfo } from '@/decorators/custom.decorator'
import { NodemailerService } from '@/modules/nodemailer/nodemailer.service'
import { RedisService } from '@/modules/redis/redis.service'
import { generateParseIntPipe } from '@/utils'

import { LoginUserDto } from './dto/login-user.dto'
import { RegisterUserDto } from './dto/register-user.dto'
import { UpdateUserDto } from './dto/udpate-user.dto'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto'
import { UserService } from './user.service'
import { LoginUserVo } from './vo/login-user.vo'
import { RefreshTokenVo } from './vo/refresh-token.vo'
import { UserDetailVo } from './vo/user-detail.vo'
import { UserListVo } from './vo/user-list.vo'

@Controller('user')
@ApiTags('用户管理模块')
export class UserController {
  @Inject(UserService)
  userService: UserService

  @Inject(ConfigService)
  private configService: ConfigService

  @Inject(JwtService)
  private jwtService: JwtService

  @Inject(NodemailerService)
  private nodemailerService: NodemailerService

  @Inject(RedisService)
  private redisService: RedisService

  @Get('register-captcha')
  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xxx@xx.com'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8)

    await this.redisService.set(`captcha_${address}`, code, 5 * 60)

    await this.nodemailerService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`
    })
    return '发送成功'
  }

  @Post('register')
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确/用户已存在',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/失败',
    type: String
  })
  async register(@Body() registerUser: RegisterUserDto) {
    return this.userService.register(registerUser)
  }

  @Get('init-data')
  async initData() {
    await this.userService.initData()
    return 'done'
  }

  @Get('test-data')
  async testData() {
    return this.userService.findUserById(3, true)
    // return 'done'
  }

  @Post('login')
  @ApiBody({
    type: LoginUserDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户不存在/密码错误',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和 token',
    type: LoginUserVo
  })
  async userLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false)

    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions
      },
      {
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRES_TIME') || '30m'
      }
    )

    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id
      },
      {
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRES_TIME') || '7d'
      }
    )

    return vo
  }

  @Post('admin/login')
  @ApiBody({
    type: LoginUserDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户不存在/密码错误',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和 token',
    type: LoginUserVo
  })
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true)

    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        email: vo.userInfo.email,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions
      },
      {
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRES_TIME') || '30m'
      }
    )

    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id
      },
      {
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRES_TIME') || '7d'
      }
    )

    return vo
  }

  @Get('refresh')
  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: '刷新 token',
    required: true,
    example: 'xxxxxxxxyyyyyyyyzzzzz'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效，请重新登录'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: RefreshTokenVo
  })
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken)

      const user = await this.userService.findUserById(data.userId, false)

      const signedAccessToken = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          roles: user.roles
          // permissions: user.permissions
        },
        {
          expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRES_TIME') || '30m'
        }
      )

      const signedRefreshToken = this.jwtService.sign(
        {
          userId: user.id
        },
        {
          expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRES_TIME') || '7d'
        }
      )

      const vo = new RefreshTokenVo()
      vo.accessToken = signedAccessToken
      vo.refreshToken = signedRefreshToken

      return vo
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录')
    }
  }

  @Get('admin/refresh')
  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: '刷新 token',
    required: true,
    example: 'xxxxxxxxyyyyyyyyzzzzz'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效，请重新登录'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: RefreshTokenVo
  })
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken)

      const user = await this.userService.findUserById(data.userId, true)

      const signedAccessToken = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          roles: user.roles
          // permissions: user.permissions
        },
        {
          expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRES_TIME') || '30m'
        }
      )

      const signedRefreshToken = this.jwtService.sign(
        {
          userId: user.id
        },
        {
          expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRES_TIME') || '7d'
        }
      )

      const vo = new RefreshTokenVo()
      vo.accessToken = signedAccessToken
      vo.refreshToken = signedRefreshToken

      return vo
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录')
    }
  }

  @Get('info')
  @RequireLogin()
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
    type: UserDetailVo
  })
  async info(@UserInfo('userId') userId: number) {
    const user = await this.userService.findUserDetailById(userId)

    const vo = new UserDetailVo()
    vo.id = user.id
    vo.email = user.email
    vo.username = user.username
    vo.headPic = user.headPic
    vo.phoneNumber = user.phoneNumber
    vo.nickName = user.nickName
    vo.createTime = user.createTime
    vo.isFrozen = user.isFrozen

    return vo
  }

  @Post(['update_password', 'admin/update_password'])
  @RequireLogin()
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserPasswordDto
  })
  @ApiResponse({
    type: String,
    description: '密码修改成功'
  })
  async updatePassword(
    @UserInfo('userId') userId: number,
    @Body() passwordDto: UpdateUserPasswordDto
  ) {
    return this.userService.updatePassword(userId, passwordDto)
  }

  @Get('update_password/captcha')
  @RequireLogin()
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
  async updatePasswordCaptcha(@UserInfo('email') address: string) {
    const code = Math.random().toString().slice(2, 8)

    await this.redisService.set(`update_password_captcha_${address}`, code, 10 * 60)

    await this.nodemailerService.sendMail({
      to: address,
      subject: '更改密码验证码',
      html: `<p>你的更改密码验证码是 ${code}</p>`
    })
    return '发送成功'
  }

  @Post(['update', 'admin/update'])
  @RequireLogin()
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/不正确'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    type: String
  })
  update(@UserInfo('userId') userId: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(userId, updateUserDto)
  }

  @Get('update/captcha')
  @RequireLogin()
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
  @ApiBearerAuth()
  async updateCaptcha(@UserInfo('email') address: string) {
    const code = Math.random().toString().slice(2, 8)

    await this.redisService.set(`update_user_captcha_${address}`, code, 10 * 60)

    await this.nodemailerService.sendMail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的验证码是 ${code}</p>`
    })
    return '发送成功'
  }

  @Get('freeze')
  @RequireLogin()
  @ApiBearerAuth()
  @ApiQuery({
    name: 'id',
    description: 'userId',
    type: Number
  })
  @ApiResponse({
    type: String,
    description: 'success'
  })
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId)
    return 'success'
  }

  @Get('list')
  @RequireLogin()
  @ApiBearerAuth()
  @ApiQuery({
    name: 'pageNo',
    description: '第几页',
    type: Number
  })
  @ApiQuery({
    name: 'pageSize',
    description: '每页多少条',
    type: Number
  })
  @ApiQuery({
    name: 'username',
    description: '用户名',
    type: Number
  })
  @ApiQuery({
    name: 'nickName',
    description: '昵称',
    type: Number
  })
  @ApiQuery({
    name: 'email',
    description: '邮箱地址',
    type: Number
  })
  @ApiResponse({
    type: UserListVo,
    description: '用户列表'
  })
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo')) pageNo: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string
  ) {
    return this.userService.findUsers(username, nickName, email, pageNo, pageSize)
  }
}

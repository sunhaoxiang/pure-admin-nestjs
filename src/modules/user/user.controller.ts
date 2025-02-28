import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FastifyRequest } from 'fastify'

import { DeleteManyDto } from '@/common/dto'
import { CacheTTL, CacheUserKey, Public, Refresh, UserInfo } from '@/decorators'
import { CacheInterceptor } from '@/interceptors'
import { CacheService } from '@/modules/cache/cache.service'
import { NodemailerService } from '@/modules/nodemailer/nodemailer.service'
import { JwtUserData } from '@/types'

import { CreateUserDto } from './dto/create-user.dto'
import { RegisterUserDto } from './dto/register-user.dto'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserListDto } from './dto/user-list.dto'
import { UserService } from './user.service'
import { RefreshTokenVo } from './vo/refresh-token.vo'
import { UserDetailVo } from './vo/user-detail.vo'

@Controller('user')
@ApiTags('用户管理模块')
export class UserController {
  private static readonly CACHE_TTL = 60 * 60 * 8

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly nodemailerService: NodemailerService,
    private readonly cacheService: CacheService,
  ) {}

  @Public()
  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: FastifyRequest) {
    const accessToken = this.jwtService.sign(
      {
        ...req.user,
        type: 'access',
      },
      {
        expiresIn: this.configService.get('JWT_EXPIRES') || '30m',
      },
    )

    const refreshToken = this.jwtService.sign(
      {
        ...req.user,
        type: 'refresh',
      },
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES') || '7d',
      },
    )

    return {
      accessToken,
      refreshToken,
    }
  }

  @Refresh()
  @Get('refresh')
  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: '刷新 token',
    required: true,
    example: '',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效，请重新登录',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: RefreshTokenVo,
  })
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken)

      const payload = await this.userService.getJwtPayloadData(data.id)

      const signedAccessToken = this.jwtService.sign(
        {
          ...payload,
          type: 'access',
        },
        {
          expiresIn: this.configService.get('JWT_EXPIRES') || '30m',
        },
      )

      const signedRefreshToken = this.jwtService.sign(
        {
          ...payload,
          type: 'refresh',
        },
        {
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES') || '7d',
        },
      )

      return {
        accessToken: signedAccessToken,
        refreshToken: signedRefreshToken,
      }
    }
    catch {
      throw new UnauthorizedException('token 已失效，请重新登录')
    }
  }

  @Get('info')
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
    type: UserDetailVo,
  })
  // @CacheUserKey('user:info')
  // @CacheTTL(UserController.CACHE_TTL)
  // @UseInterceptors(CacheInterceptor)
  async info(@UserInfo() jwtUserData: JwtUserData) {
    return this.userService.getUserInfo(jwtUserData)
  }

  @Public()
  @Get('register-captcha')
  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xxx@xx.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8)

    await this.cacheService.set(`captcha_${address}`, code, 5 * 60)

    await this.nodemailerService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`,
    })
    return '发送成功'
  }

  @Public()
  @Post('register')
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确/用户已存在',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/失败',
    type: String,
  })
  async register(@Body() registerUser: RegisterUserDto) {
    return this.userService.register(registerUser)
  }

  @Post(['update_password', 'admin/update_password'])
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserPasswordDto,
  })
  @ApiResponse({
    type: String,
    description: '密码修改成功',
  })
  async updatePassword(
    @UserInfo('id') id: number,
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    return this.userService.updatePassword(id, passwordDto)
  }

  @Get('update_password/captcha')
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
  async updatePasswordCaptcha(@UserInfo('email') address: string) {
    const code = Math.random().toString().slice(2, 8)

    await this.cacheService.set(`update_password_captcha_${address}`, code, 10 * 60)

    await this.nodemailerService.sendMail({
      to: address,
      subject: '更改密码验证码',
      html: `<p>你的更改密码验证码是 ${code}</p>`,
    })
    return '发送成功'
  }

  // @Post(['update', 'admin/update'])
  // @ApiBearerAuth()
  // @ApiBody({
  //   type: UpdateUserDto,
  // })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: '验证码已失效/不正确',
  // })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: '更新成功',
  //   type: String,
  // })
  // update(@UserInfo('id') id: number, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(id, updateUserDto)
  // }

  @Get('update/captcha')
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
  @ApiBearerAuth()
  async updateCaptcha(@UserInfo('email') address: string) {
    const code = Math.random().toString().slice(2, 8)

    await this.cacheService.set(`update_user_captcha_${address}`, code, 10 * 60)

    await this.nodemailerService.sendMail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的验证码是 ${code}</p>`,
    })
    return '发送成功'
  }

  @Get('freeze')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'id',
    description: 'userId',
    type: Number,
  })
  @ApiResponse({
    type: String,
    description: 'success',
  })
  async freeze(@Query('id') id: number) {
    await this.userService.freezeUserById(id)
    return 'success'
  }

  @Get()
  @ApiBearerAuth()
  async list(@Query() userListDto: UserListDto) {
    return this.userService.findMany(userListDto)
  }

  @Post()
  @ApiBearerAuth()
  @ApiBody({
    type: CreateUserDto,
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Delete()
  @ApiBearerAuth()
  async deleteMany(@Body() deleteManyDto: DeleteManyDto) {
    return this.userService.deleteMany(deleteManyDto.ids)
  }

  @Get(':id')
  @ApiBearerAuth()
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id)
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserDto,
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto)
  }

  @Delete(':id')
  @ApiBearerAuth()
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.delete(id)
  }
}

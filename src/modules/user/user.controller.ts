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
import { USER } from '@/constants/permissions'
import { CacheTTL, CacheUserKey, Permissions, Public, Refresh, UserInfo } from '@/decorators'
import { CacheInterceptor } from '@/interceptors'
import { CacheService } from '@/modules/cache/cache.service'
import { NodemailerService } from '@/modules/nodemailer/nodemailer.service'
import { JwtUserData } from '@/types'

import { CreateUserDto } from './dto/create-user.dto'
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

  @Post('password')
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserPasswordDto,
  })
  async updatePassword(@UserInfo('id') id: number, @Body() updateUserPasswordDto: UpdateUserPasswordDto) {
    return this.userService.updatePassword(id, updateUserPasswordDto)
  }

  @Get()
  @Permissions(USER.READ)
  @ApiBearerAuth()
  async list(@Query() userListDto: UserListDto) {
    return this.userService.findMany(userListDto)
  }

  @Post()
  @Permissions(USER.CREATE)
  @ApiBearerAuth()
  @ApiBody({
    type: CreateUserDto,
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Delete()
  @Permissions(USER.DELETE)
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
  @Permissions(USER.UPDATE)
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserDto,
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto)
  }

  @Delete(':id')
  @Permissions(USER.DELETE)
  @ApiBearerAuth()
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.delete(id)
  }
}

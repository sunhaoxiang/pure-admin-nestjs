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
  UsePipes,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FastifyRequest } from 'fastify'

import { DeleteManyDto } from '@/common/dto'
import { USER } from '@/constants/permissions'
import {
  CacheInvalidate,
  CacheInvalidateUser,
  CacheKey,
  CacheTTL,
  CacheUserKey,
  Permissions,
  Public,
  Refresh,
  UserInfo,
} from '@/decorators'
import { CacheInterceptor } from '@/interceptors'
import { updateValidationPipe } from '@/pipes'
import { JwtUserData } from '@/types'

import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserListDto } from './dto/user-list.dto'
import { UserService } from './user.service'

@Controller('user')
@ApiTags('用户管理模块')
export class UserController {
  private static readonly CACHE_TTL = 60 * 60 * 1

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
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
  @CacheUserKey('user:info')
  @CacheTTL(UserController.CACHE_TTL)
  @UseInterceptors(CacheInterceptor)
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
  })
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
  @CacheKey('user:list')
  @CacheTTL(UserController.CACHE_TTL)
  @UseInterceptors(CacheInterceptor)
  @ApiBearerAuth()
  async list(@Query() userListDto: UserListDto) {
    return this.userService.findMany(userListDto)
  }

  @Post()
  @Permissions(USER.CREATE)
  @CacheInvalidate('user:list')
  @UseInterceptors(CacheInterceptor)
  @ApiBearerAuth()
  @ApiBody({
    type: CreateUserDto,
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Delete()
  @Permissions(USER.DELETE)
  @CacheInvalidate('user:list')
  @UseInterceptors(CacheInterceptor)
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
  @CacheInvalidate('user:list')
  @CacheInvalidateUser('user:info', req => req.params.id)
  @UseInterceptors(CacheInterceptor)
  @UsePipes(updateValidationPipe)
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserDto,
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto)
  }

  @Delete(':id')
  @Permissions(USER.DELETE)
  @CacheInvalidate('user:list')
  @CacheInvalidateUser('user:info', req => req.params.id)
  @UseInterceptors(CacheInterceptor)
  @ApiBearerAuth()
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.delete(id)
  }
}

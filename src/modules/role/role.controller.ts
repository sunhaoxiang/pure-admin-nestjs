import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseInterceptors, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { DeleteManyDto } from '@/common/dto'
import { ROLE } from '@/constants/permissions'
import { CacheInvalidate, CacheKey, CacheTTL, Permissions } from '@/decorators'
import { CacheInterceptor } from '@/interceptors'
import { updateValidationPipe } from '@/pipes'

import { CreateRoleDto } from './dto/create-role.dto'
import { RoleListDto } from './dto/role-list.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { RoleService } from './role.service'

@Controller('role')
@ApiTags('角色管理模块')
export class RoleController {
  private static readonly CACHE_TTL = 60 * 60 * 1

  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Permissions(ROLE.READ)
  @CacheKey('role:list')
  @CacheTTL(RoleController.CACHE_TTL)
  @UseInterceptors(CacheInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiOkResponse({ description: '获取角色列表成功' })
  async list(@Query() roleListDto: RoleListDto) {
    return this.roleService.findMany(roleListDto)
  }

  @Get('all')
  @Permissions(ROLE.READ)
  @CacheKey('role:all')
  @CacheTTL(RoleController.CACHE_TTL)
  @UseInterceptors(CacheInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有角色' })
  @ApiOkResponse({ description: '获取所有角色成功' })
  async all() {
    return this.roleService.findAll()
  }

  @Post()
  @Permissions(ROLE.CREATE)
  @CacheInvalidate(['role:list', 'role:all'])
  @UseInterceptors(CacheInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建角色' })
  @ApiOkResponse({ description: '创建角色成功' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto)
  }

  @Delete()
  @Permissions(ROLE.DELETE)
  @CacheInvalidate(['role:list', 'role:all'])
  @UseInterceptors(CacheInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量删除角色' })
  @ApiOkResponse({ description: '批量删除角色成功' })
  async deleteMany(@Body() deleteManyDto: DeleteManyDto) {
    return this.roleService.deleteMany(deleteManyDto.ids)
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取角色详情' })
  @ApiOkResponse({ description: '获取角色详情成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id)
  }

  @Put(':id')
  @Permissions(ROLE.UPDATE)
  @CacheInvalidate(['role:list', 'role:all'])
  @UseInterceptors(CacheInterceptor)
  @UsePipes(updateValidationPipe)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新角色' })
  @ApiOkResponse({ description: '更新角色成功' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto)
  }

  @Delete(':id')
  @Permissions(ROLE.DELETE)
  @CacheInvalidate(['role:list', 'role:all'])
  @UseInterceptors(CacheInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除角色' })
  @ApiOkResponse({ description: '删除角色成功' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.delete(id)
  }
}

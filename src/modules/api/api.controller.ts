import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiType } from '@prisma/client'

import { updateValidationPipe } from '@/pipes'

import { ApiService } from './api.service'
import { CreateApiDto } from './dto/create-api.dto'
import { UpdateApiDto } from './dto/update-api.dto'

@Controller('api')
@ApiTags('接口管理模块')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取接口树' })
  @ApiOkResponse({
    description: '获取接口树成功',
  })
  findApiTree() {
    return this.apiService.findApiTree()
  }

  @Get('/flat')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取接口扁平化列表' })
  @ApiOkResponse({
    description: '获取接口扁平化列表成功',
  })
  findFlatApiTree() {
    return this.apiService.findFlatApiTree()
  }

  @Get('/permission')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取有权限的接口列表' })
  @ApiOkResponse({
    description: '获取有权限的接口列表成功',
  })
  findPermissionApis() {
    return this.apiService.findPermissionApis()
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建接口' })
  @ApiOkResponse({
    description: '创建接口成功',
  })
  create(@Body() createApiDto: CreateApiDto) {
    return this.apiService.create(createApiDto)
  }

  @Get(':id')
  @ApiBearerAuth()
  async getApiById(@Param('id', ParseIntPipe) id: number) {
    return this.apiService.findApiById(id)
  }

  @Put(':id')
  @UsePipes(updateValidationPipe)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新接口' })
  @ApiOkResponse({
    description: '更新接口成功',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateApiDto: UpdateApiDto) {
    return this.apiService.update(id, updateApiDto)
  }

  @Delete(':id')
  @ApiBearerAuth()
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.apiService.delete(id)
  }
}

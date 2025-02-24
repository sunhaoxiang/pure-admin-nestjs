import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { updateValidationPipe } from '@/pipes'

import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { MenuService } from './menu.service'

@Controller('menu')
@ApiTags('菜单管理模块')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // @Get()
  // @ApiOperation({ summary: '获取菜单列表' })
  // @ApiOkResponse({
  //   description: '获取菜单列表成功',
  // })
  // findAll() {
  //   return this.menuService.findAll()
  // }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取菜单' })
  @ApiOkResponse({
    description: '获取菜单树成功',
  })
  findMenuTree() {
    return this.menuService.findMenuTree()
  }

  @Get('/flat')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取菜单扁平化列表' })
  @ApiOkResponse({
    description: '获取菜单扁平化列表成功',
  })
  findFlatMenuTree() {
    return this.menuService.findFlatMenuTree()
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建菜单' })
  @ApiOkResponse({
    description: '创建菜单成功',
  })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto)
  }

  @Get(':id')
  @ApiBearerAuth()
  async getMenuById(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.findMenuById(id)
  }

  @Put(':id')
  @UsePipes(updateValidationPipe)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新菜单' })
  @ApiOkResponse({
    description: '更新菜单成功',
  })
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(+id, updateMenuDto)
  }

  @Delete(':id')
  @ApiBearerAuth()
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.delete(id)
  }
}

import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { MenuService } from './menu.service'

@Controller('menu')
@ApiTags('菜单管理模块')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}
}

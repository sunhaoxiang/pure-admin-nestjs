import { ApiProperty } from '@nestjs/swagger'
import { Menu } from '@prisma/client'

import { TreeNode } from '@/utils'

export class UserInfoVo {
  @ApiProperty()
  id: number

  @ApiProperty({ example: 'zhangsan' })
  username: string

  @ApiProperty({ example: '张三' })
  nickName: string

  @ApiProperty({ example: 'xxx.png' })
  headPic: string

  @ApiProperty()
  menus: TreeNode<Menu>[]
}

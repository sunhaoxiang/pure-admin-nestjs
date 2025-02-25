import { ApiProperty } from '@nestjs/swagger'

class UserInfo {
  @ApiProperty()
  id: number

  @ApiProperty({ example: 'zhangsan' })
  username: string

  @ApiProperty({ example: '张三' })
  nickName: string

  @ApiProperty({ example: 'xx@xx.com' })
  email: string

  @ApiProperty({ example: 'xxx.png' })
  headPic: string

  @ApiProperty({ example: '13233333333' })
  phone: string

  @ApiProperty()
  isFrozen: boolean

  @ApiProperty()
  isSuperAdmin: boolean

  @ApiProperty()
  createTime: number

  @ApiProperty({ example: ['管理员'] })
  roles: number[]

  @ApiProperty({ example: 'query_aaa' })
  permissions: string[]
}
export class LoginUserVo {
  @ApiProperty()
  userInfo: UserInfo

  @ApiProperty()
  token: string

  @ApiProperty()
  refreshToken: string
}

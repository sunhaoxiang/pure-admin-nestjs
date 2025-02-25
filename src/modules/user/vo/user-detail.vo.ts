import { ApiProperty } from '@nestjs/swagger'

export class UserDetailVo {
  @ApiProperty()
  id: number

  @ApiProperty()
  username: string

  @ApiProperty()
  nickName: string

  @ApiProperty()
  headPic: string

  @ApiProperty()
  email: string

  @ApiProperty()
  phone: string
}

import { ApiProperty } from '@nestjs/swagger'

export class RefreshTokenVo {
  @ApiProperty()
  accessToken: string

  @ApiProperty()
  refreshToken: string
}

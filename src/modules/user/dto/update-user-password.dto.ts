import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, MinLength } from 'class-validator'

export class UpdateUserPasswordDto {
  @IsNotEmpty({
    message: '密码不能为空',
  })
  @ApiProperty()
  oldPassword: string

  @IsNotEmpty({
    message: '新密码不能为空',
  })
  @MinLength(6, {
    message: '新密码不能少于 6 位',
  })
  @ApiProperty()
  newPassword: string
}

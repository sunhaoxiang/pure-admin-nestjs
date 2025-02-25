import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional } from 'class-validator'

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  username: string

  @ApiProperty()
  @IsNotEmpty()
  password: string

  @ApiProperty()
  @IsOptional()
  nickName?: string

  @ApiProperty()
  @IsOptional()
  headPic?: string

  @IsOptional()
  @IsEmail(
    {},
    {
      message: '不是合法的邮箱格式',
    },
  )
  @ApiProperty()
  email?: string

  @ApiProperty()
  @IsOptional()
  phone?: string

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isFrozen?: boolean = false
}

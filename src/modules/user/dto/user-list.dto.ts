import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

import { PageDto } from '@/common/dto'

export class UserListDto extends PageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  username?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nickName?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string
}

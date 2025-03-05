import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'username',
    }),
  })
  username: string

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'password',
    }),
  })
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
      message: i18nValidationMessage('validation.invalid', {
        field: 'email',
      }),
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

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsInt({
    each: true,
  })
  roles?: number[]
}

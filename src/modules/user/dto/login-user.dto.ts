import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class LoginUserDto {
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'username',
    }),
  })
  @ApiProperty()
  username: string

  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'password',
    }),
  })
  @ApiProperty()
  password: string
}

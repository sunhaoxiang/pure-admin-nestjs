import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, MinLength } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class UpdateUserPasswordDto {
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'oldPassword',
    }),
  })
  @ApiProperty()
  oldPassword: string

  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'newPassword',
    }),
  })
  @MinLength(6, {
    message: i18nValidationMessage('validation.minLength', {
      field: 'newPassword',
      min: 6,
    }),
  })
  @ApiProperty()
  newPassword: string
}

import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class CreateRoleDto {
  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'name',
    }),
  })
  name: string

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'code',
    }),
  })
  code: string

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  menuPermissions?: string[]

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featurePermissions?: string[]

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  apiPermissions?: string[]
}

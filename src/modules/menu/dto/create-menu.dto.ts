import { ApiProperty } from '@nestjs/swagger'
import { MenuType } from '@prisma/client'
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class CreateMenuDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'type',
    }),
  })
  type: MenuType

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'title',
    }),
  })
  title: string

  @ApiProperty({ required: false })
  @IsOptional()
  icon?: string

  @ApiProperty({ required: false })
  @IsOptional()
  code?: string

  @ApiProperty({ required: false })
  @ValidateIf(object => object.type === MenuType.MENU)
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'path',
    }),
  })
  path?: string

  @ApiProperty({ required: false })
  @IsOptional()
  i18nKey?: string

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({}, {
    message: i18nValidationMessage('validation.invalid', {
      field: 'sort',
    }),
  })
  @Min(0)
  sort?: number = 0

  @ApiProperty({ required: false })
  @ValidateIf(object => object.type === MenuType.MENU)
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'isShow',
    }),
  })
  @IsBoolean()
  isShow?: boolean = true
}

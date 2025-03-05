import { ApiProperty } from '@nestjs/swagger'
import { ApiMethod, ApiType } from '@prisma/client'
import { IsNotEmpty, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class CreateApiDto {
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
  type: ApiType

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'title',
    }),
  })
  title: string

  @ApiProperty({ required: false })
  @IsOptional()
  code?: string

  @ApiProperty({ required: false })
  @IsOptional()
  method?: ApiMethod

  @ApiProperty({ required: false })
  @ValidateIf(object => object.type === ApiType.API)
  @IsNotEmpty({
    message: i18nValidationMessage('validation.notEmpty', {
      field: 'path',
    }),
  })
  path?: string

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
}

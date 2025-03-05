import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional, Min } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class PageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage('validation.invalid', { field: 'page' }) })
  @Min(1, { message: i18nValidationMessage('validation.min', { field: 'page', min: 1 }) })
  page?: number = 1

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage('validation.invalid', { field: 'pageSize' }) })
  @Min(1, { message: i18nValidationMessage('validation.min', { field: 'pageSize', min: 1 }) })
  pageSize?: number = 10
}

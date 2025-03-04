import { ApiProperty } from '@nestjs/swagger'
import { ApiMethod, ApiType } from '@prisma/client'
import { IsNotEmpty, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator'

export class CreateApiDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number

  @ApiProperty()
  @IsNotEmpty()
  type: ApiType

  @ApiProperty()
  @IsNotEmpty()
  title: string

  @ApiProperty({ required: false })
  @IsOptional()
  code?: string

  @ApiProperty({ required: false })
  @IsOptional()
  method?: ApiMethod

  @ApiProperty({ required: false })
  @ValidateIf(object => object.type === ApiType.API)
  @IsNotEmpty()
  path?: string

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sort?: number = 0
}

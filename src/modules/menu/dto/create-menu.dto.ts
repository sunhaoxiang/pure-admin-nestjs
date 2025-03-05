import { ApiProperty } from '@nestjs/swagger'
import { MenuType } from '@prisma/client'
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator'

export class CreateMenuDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number

  @ApiProperty()
  @IsNotEmpty()
  type: MenuType

  @ApiProperty()
  @IsNotEmpty()
  title: string

  @ApiProperty({ required: false })
  @ValidateIf(object => object.type === MenuType.DIRECTORY || object.type === MenuType.MENU)
  @IsNotEmpty()
  icon?: string

  @ApiProperty({ required: false })
  @IsOptional()
  code?: string

  @ApiProperty({ required: false })
  @ValidateIf(object => object.type === MenuType.MENU)
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

  @ApiProperty({ required: false })
  @ValidateIf(object => object.type === MenuType.MENU)
  @IsNotEmpty()
  @IsBoolean()
  isShow?: boolean = true
}

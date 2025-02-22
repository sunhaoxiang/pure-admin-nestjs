import { IsArray, IsNotEmpty, IsNumber } from 'class-validator'

export class DeleteManyDto {
  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  ids: number[]
}

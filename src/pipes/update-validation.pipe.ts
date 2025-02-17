import { ValidationPipe } from '@nestjs/common'

export const updateValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  validateCustomDecorators: true,
})

import { ValidationPipe } from '@nestjs/common'

export const updateValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  validateCustomDecorators: true,
  skipMissingProperties: false,
  stopAtFirstError: true,
  disableErrorMessages: true,
})

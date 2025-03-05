import { I18nValidationPipe } from 'nestjs-i18n'

export const updateValidationPipe = new I18nValidationPipe({
  transform: true,
  whitelist: true,
  validateCustomDecorators: true,
  skipMissingProperties: false,
  stopAtFirstError: true,
  disableErrorMessages: true,
})

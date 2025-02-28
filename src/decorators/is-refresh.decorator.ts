import { SetMetadata } from '@nestjs/common'

export const IS_REFRESH_KEY = 'IS_REFRESH'

export const Refresh = () => SetMetadata(IS_REFRESH_KEY, true)

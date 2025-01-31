import { SetMetadata } from '@nestjs/common'

export const REQUIRE_PERMISSIONS_KEY = 'REQUIRE_PERMISSIONS'

export function Permissions(...permissions: string[]) {
  return SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions)
}

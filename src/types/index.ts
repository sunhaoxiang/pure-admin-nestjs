declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUserData
  }
}

export type TokenType = 'access' | 'refresh'

export interface JwtUserData {
  id: number
  username: string
  isSuperAdmin: boolean
  menuPermissions: string[]
  featurePermissions: string[]
  apiPermissions: string[]
  tokenType: TokenType
}

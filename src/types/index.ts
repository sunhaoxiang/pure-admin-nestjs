declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUserData
  }
}

export interface JwtUserData {
  id: number
  username: string
}

export interface UserAuthorizationInfo {
  id: number
  username: string
  permissions: string[]
  isAdmin: boolean
}

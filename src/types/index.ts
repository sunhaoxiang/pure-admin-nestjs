export interface JwtUserData {
  id: number
  username: string
  // roles: number[]
  permissions: string[]
  isAdmin: boolean
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUserData
  }
}

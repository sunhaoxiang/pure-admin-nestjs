export interface JwtUserData {
  id: number
  username: string
  roles: number[]
  permissions: string[]
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUserData
  }
}

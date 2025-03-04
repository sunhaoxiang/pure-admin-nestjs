declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUserData
  }
}

export interface JwtUserData {
  id: number
  username: string
  isSuperAdmin: boolean
  menuPermissions: string[]
  featurePermissions: string[]
  apiPermissions: string[]
  tokenType: 'access' | 'refresh'
}

// export interface UserAuthorizationInfo {
//   id: number
//   username: string
//   isSuperAdmin: boolean
//   menuPermissions: string[]
// }

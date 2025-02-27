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
}

// export interface UserAuthorizationInfo {
//   id: number
//   username: string
//   isSuperAdmin: boolean
//   menuPermissions: string[]
// }

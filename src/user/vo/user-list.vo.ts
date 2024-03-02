class User {
  id: number

  username: string

  nickName: string

  email: string

  phoneNumber: string

  isFrozen: boolean

  headPic: string

  createTime: Date
}

export class UserListVo {
  users: Array<User>

  totalCount: number
}

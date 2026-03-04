declare namespace Auth {
  interface LoginParams {
    phone: string
    password: string
  }

  interface RegisterParams extends LoginParams {
    nickname: string
  }

  interface LoginResult {
    token: string
    user?: UserInfo
  }

  interface UserInfo {
    phone: string
    password: string | null
    nickname: string
    id: string
    avatar: string | null
    createdAt: Date
    updatedAt: Date
  }
}

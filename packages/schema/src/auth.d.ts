declare namespace Auth {
  type LoginParams = import('./auth').LoginParams
  type RegisterParams = import('./auth').RegisterParams

  interface UserInfo {
    id: string
    phone: string
    password: string | null
    nickname: string
    avatar: string | null
    createdAt: Date
    updatedAt: Date
  }

  interface LoginResult {
    token: string
    user?: UserInfo
  }
}

// auth.d.ts
declare module '#auth-utils' {
  interface User {
    userId: string
    email: string
    name: string
    avatarUrl: string
    plan?: string
    balance?: number
    planExpiresAt?: Date | null
  }

  interface UserSession {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extended?: any
    jwt?: {
      accessToken: string
      refreshToken: string
    }
    loggedInAt: number
    user: User
  }
}

export {}

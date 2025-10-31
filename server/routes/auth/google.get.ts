export default defineOAuthGoogleEventHandler({
  config: {
    authorizationParams: {
      access_type: 'offline'
    }
  },
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user?.picture
      },
      loggedInAt: Date.now()
    })

    return sendRedirect(event, '/')
  }
})

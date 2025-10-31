export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true
  },
  async onSuccess(event, { user, tokens }) {
    console.log('GitHub OAuth tokens:', user)
    await setUserSession(event, {
      user: {
        userId: user.id,
        avatarUrl: user?.avatar_url,
        email: user?.email,
        name: user?.name
      }
    })
    return sendRedirect(event, '/')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  }
})

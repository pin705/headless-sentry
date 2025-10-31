// Webhook handler for Lemon Squeezy (International market)
// Processes subscription and one-time payment events

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // TODO: Verify Lemon Squeezy webhook signature
  // const signature = getHeader(event, 'x-signature')
  // if (!verifyLemonSqueezySignature(signature, body)) {
  //   throw createError({ statusCode: 401, message: 'Invalid signature' })
  // }

  const { meta, data } = body

  if (!meta || !data) {
    throw createError({
      statusCode: 400,
      message: 'Invalid webhook payload'
    })
  }

  const eventName = meta.event_name
  const customData = data.attributes?.custom_data || {}
  const userEmail = customData.user_email

  if (!userEmail) {
    console.error('No user_email in custom_data')
    return { success: false, message: 'Missing user_email in custom_data' }
  }

  try {
    const user = await User.findOne({ email: userEmail })
    
    if (!user) {
      console.error('User not found:', userEmail)
      return { success: false, message: 'User not found' }
    }

    switch (eventName) {
      case 'order_created':
      case 'subscription_created':
        // Upgrade user to pro plan
        user.plan = 'pro'
        // Set expiration date (e.g., 30 days from now)
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + 30)
        user.planExpiresAt = expirationDate
        await user.save()
        
        console.log('User upgraded to pro:', userEmail)
        break

      case 'subscription_cancelled':
      case 'subscription_expired':
        // Downgrade user to free plan
        user.plan = 'free'
        user.planExpiresAt = null
        await user.save()
        
        console.log('User downgraded to free:', userEmail)
        break

      case 'subscription_updated':
        // Handle subscription updates (renewal, etc.)
        // Update expiration date if needed
        break

      default:
        console.log('Unhandled Lemon Squeezy event:', eventName)
    }

    return {
      success: true,
      message: 'Webhook processed successfully'
    }
  } catch (error: any) {
    console.error('Lemon Squeezy webhook error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Error processing webhook'
    })
  }
})

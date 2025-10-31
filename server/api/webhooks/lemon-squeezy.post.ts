// Webhook handler for Lemon Squeezy (International market)
// Processes subscription and one-time payment events
// Models (User, Transaction) are auto-imported by nuxt-mongoose

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

    const orderId = data.id
    const amount = data.attributes?.total || 0

    switch (eventName) {
      case 'order_created':
      case 'subscription_created': {
        // Upgrade user to pro plan
        const previousPlan = user.plan
        user.plan = 'pro'
        // Set expiration date (e.g., 30 days from now)
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + 30)
        user.planExpiresAt = expirationDate
        await user.save()

        // Create transaction record
        const transaction = await Transaction.create({
          userId: user._id,
          amount: amount * 25000, // Convert USD to VND (approximate)
          type: 'plan_upgrade',
          method: 'lemon_squeezy',
          status: 'completed',
          previousBalance: user.balance,
          newBalance: user.balance,
          planBefore: previousPlan,
          planAfter: 'pro',
          externalId: orderId,
          externalData: data,
          note: 'Nâng cấp lên gói PRO qua Lemon Squeezy'
        })

        // Send payment success email
        try {
          const config = useRuntimeConfig()
          const { createPaymentSuccessTemplate, sendMail } = await import('~~/server/utils/sendMail')
          const { getLanguageForUser } = await import('~~/server/utils/i18n')
          
          // Get user's preferred language, default to English for Lemon Squeezy
          const userLang = await getLanguageForUser(user._id.toString(), userEmail)
          
          const emailTemplate = createPaymentSuccessTemplate(
            userEmail,
            transaction.amount,
            transaction._id.toString(),
            'pro',
            expirationDate,
            userLang
          )

          await sendMail(
            {
              to: userEmail,
              from: config.email.from,
              subject: emailTemplate.subject,
              html: emailTemplate.html
            },
            {
              host: config.email.host,
              port: parseInt(config.email.port),
              secure: config.email.secure,
              auth: {
                user: config.email.user,
                pass: config.email.pass
              }
            }
          )
          console.log('Payment success email sent to:', userEmail)
        } catch (emailError) {
          console.error('Failed to send payment email:', emailError)
          // Don't throw error as the payment was successful
        }

        console.log('User upgraded to pro:', userEmail)
        break
      }
      case 'subscription_cancelled':
      case 'subscription_expired': {
        // Downgrade user to free plan
        const planBeforeDowngrade = user.plan
        user.plan = 'free'
        user.planExpiresAt = null
        await user.save()

        // Create transaction record for tracking
        await Transaction.create({
          userId: user._id,
          amount: 0,
          type: 'plan_upgrade',
          method: 'lemon_squeezy',
          status: 'completed',
          previousBalance: user.balance,
          newBalance: user.balance,
          planBefore: planBeforeDowngrade,
          planAfter: 'free',
          externalId: orderId,
          externalData: data,
          note: eventName === 'subscription_cancelled'
            ? 'Hủy đăng ký gói PRO'
            : 'Gói PRO đã hết hạn'
        })

        console.log('User downgraded to free:', userEmail)
        break
      }
      case 'subscription_updated': {
        // Handle subscription updates (renewal, etc.)
        if (user.plan === 'pro' && user.planExpiresAt) {
          // Extend expiration date by 30 days
          const newExpiration = new Date(user.planExpiresAt)
          newExpiration.setDate(newExpiration.getDate() + 30)
          user.planExpiresAt = newExpiration
          await user.save()

          await Transaction.create({
            userId: user._id,
            amount: amount * 25000,
            type: 'plan_renewal',
            method: 'lemon_squeezy',
            status: 'completed',
            previousBalance: user.balance,
            newBalance: user.balance,
            planBefore: 'pro',
            planAfter: 'pro',
            externalId: orderId,
            externalData: data,
            note: 'Gia hạn gói PRO'
          })
        }
        break
      }
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

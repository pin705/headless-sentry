import { z } from 'zod'
import { getRequireUserSession, handleValidationError } from '~~/server/utils/validation'
import { getPlanLimits } from '~/shared/constants/plans'

const upgradeSchema = z.object({
  targetPlan: z.enum(['pro']),
  paymentMethod: z.enum(['lemon_squeezy', 'sepay', 'balance']),
  // For Lemon Squeezy - will redirect to checkout
  returnUrl: z.string().url().optional(),
  // For balance payment
  useBalance: z.boolean().optional()
})

// Plan prices in VND
const PLAN_PRICES = {
  pro: 200000 // 200,000 VND per month
}

export default defineEventHandler(async (event) => {
  const { session, userId } = await getRequireUserSession(event)

  try {
    const body = await readValidatedBody(event, upgradeSchema.parse)
    const user = await User.findById(userId)

    if (!user) {
      throw createError({ statusCode: 404, message: 'Người dùng không tồn tại' })
    }

    // Check if already on target plan
    if (user.plan === body.targetPlan) {
      throw createError({
        statusCode: 400,
        message: 'Bạn đang sử dụng gói này rồi'
      })
    }

    const price = PLAN_PRICES[body.targetPlan]

    // Handle different payment methods
    switch (body.paymentMethod) {
      case 'balance': {
        // Pay using account balance
        if (!body.useBalance) {
          throw createError({
            statusCode: 400,
            message: 'Vui lòng xác nhận sử dụng số dư'
          })
        }

        if (user.balance < price) {
          throw createError({
            statusCode: 400,
            message: `Số dư không đủ. Bạn cần ${price.toLocaleString('vi-VN')} VNĐ nhưng chỉ có ${user.balance.toLocaleString('vi-VN')} VNĐ`
          })
        }

        // Deduct balance and upgrade
        const previousBalance = user.balance
        user.balance -= price
        user.plan = body.targetPlan

        // Set expiration date (30 days from now)
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + 30)
        user.planExpiresAt = expirationDate

        await user.save()

        // Create transaction record
        await Transaction.create({
          userId,
          amount: price,
          type: 'plan_upgrade',
          method: 'manual',
          status: 'completed',
          previousBalance,
          newBalance: user.balance,
          planBefore: 'free',
          planAfter: body.targetPlan,
          note: `Nâng cấp lên gói ${body.targetPlan.toUpperCase()} bằng số dư tài khoản`
        })

        return {
          success: true,
          message: 'Nâng cấp thành công',
          plan: user.plan,
          planExpiresAt: user.planExpiresAt,
          balance: user.balance
        }
      }
      case 'lemon_squeezy':
        // Return checkout information for Lemon Squeezy
        // In production, you would create a checkout session via Lemon Squeezy API
        return {
          success: true,
          paymentMethod: 'lemon_squeezy',
          message: 'Vui lòng hoàn tất thanh toán qua Lemon Squeezy',
          checkoutUrl: `https://lemonsqueezy.com/checkout/buy/YOUR_VARIANT_ID?checkout[custom][user_email]=${encodeURIComponent(session.user.email)}`,
          price,
          instructions: 'Bạn sẽ được chuyển hướng đến trang thanh toán Lemon Squeezy. Sau khi thanh toán thành công, tài khoản sẽ được tự động nâng cấp.'
        }

      case 'sepay':
        // Return bank transfer information for Sepay
        return {
          success: true,
          paymentMethod: 'sepay',
          message: 'Vui lòng chuyển khoản theo thông tin dưới đây',
          price,
          bankInfo: {
            bankName: 'MB Bank',
            accountNumber: '0123456789',
            accountName: 'HEADLESS SENTRY',
            amount: price,
            transferContent: `NANGCAP ${user.email}`
          },
          instructions: 'Sau khi chuyển khoản thành công, hệ thống sẽ tự động xác nhận và nâng cấp tài khoản của bạn trong vòng 1-2 phút.'
        }

      default:
        throw createError({
          statusCode: 400,
          message: 'Phương thức thanh toán không hợp lệ'
        })
    }
  } catch (error) {
    handleValidationError(error)
    console.error('Lỗi nâng cấp gói:', error)
    throw error
  }
})

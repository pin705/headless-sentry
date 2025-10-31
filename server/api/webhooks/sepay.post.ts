// Webhook handler for Sepay (Vietnam market)
// Listens for bank account balance changes and processes recharge requests
// Models (User, Transaction) are auto-imported by nuxt-mongoose

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Verify webhook signature or admin access
  const session = await getUserSession(event)
  const email = session.user?.email

  // For now, only admin can trigger this endpoint manually
  // In production, you would verify Sepay webhook signature
  if (email !== process.env.ADMIN_EMAIL) {
    return {
      success: false,
      message: 'Chỉ admin mới có quyền nạp tiền hoặc webhook không hợp lệ'
    }
  }

  const { amount, method, note, userEmail } = body

  if (!amount || !userEmail) {
    throw createError({
      statusCode: 400,
      message: 'Thiếu thông tin bắt buộc: amount, userEmail'
    })
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: userEmail })

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Không tìm thấy người dùng với email: ' + userEmail
      })
    }

    // Update user balance (amount is in VND)
    const previousBalance = user.balance || 0
    user.balance = previousBalance + amount
    await user.save()

    // Create transaction record for audit trail
    await Transaction.create({
      userId: user._id,
      amount,
      type: 'deposit',
      method: method || 'sepay',
      status: 'completed',
      previousBalance,
      newBalance: user.balance,
      note: note || 'Nạp tiền qua Sepay',
      metadata: { adminEmail: email }
    })

    return {
      success: true,
      message: `Đã nạp ${amount.toLocaleString('vi-VN')} VNĐ vào tài khoản ${userEmail}`,
      data: {
        userEmail,
        amount,
        previousBalance,
        newBalance: user.balance
      }
    }
  } catch (error: any) {
    console.error('Sepay webhook error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Lỗi khi xử lý nạp tiền'
    })
  }
})

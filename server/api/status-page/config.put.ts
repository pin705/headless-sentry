// server/api/status-page/config.put.ts
import { z } from 'zod'
import mongoose from 'mongoose'

// (MỚI) Regex để validate tên miền cơ bản
const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/

// (Nâng cấp) Schema validation cho input
const configSchema = z.object({
  isEnabled: z.boolean().default(false),
  slug: z.string()
    .min(3, 'Slug phải có ít nhất 3 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và gạch ngang')
    .optional()
    .nullable(),
  title: z.string().min(1, 'Tiêu đề không được trống').default('Trạng thái Dịch vụ'),
  logoUrl: z.string().url('URL logo không hợp lệ').nullable().default(null),

  // (MỚI) Validation cho Custom Domain
  // customDomain: z.string()
  //   .regex(domainRegex, 'Tên miền không hợp lệ')
  //   .nullable()
  //   .optional()
  //   .transform(val => val ? val.toLowerCase().trim() : null) // Chuẩn hóa
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu đăng nhập' })
  }

  try {
    const body = await readValidatedBody(event, configSchema.parse)
    const userId = new mongoose.Types.ObjectId(session.user.userId)

    // --- (Nâng cấp) Kiểm tra tính duy nhất ---
    const checks = []
    // 1. Check Slug uniqueness
    if (body.isEnabled && body.slug) {
      checks.push(User.findOne({ 'statusPage.slug': body.slug, '_id': { $ne: userId } }))
    }
    // 2. Check Custom Domain uniqueness
    if (body.isEnabled && body.customDomain) {
      checks.push(User.findOne({ 'statusPage.customDomain': body.customDomain, '_id': { $ne: userId } }))
    }

    const [existingSlugUser, existingDomainUser] = await Promise.all(checks)

    if (existingSlugUser) {
      throw createError({ statusCode: 409, message: 'Slug này đã được sử dụng.' })
    }
    if (existingDomainUser) {
      throw createError({ statusCode: 409, message: 'Tên miền tùy chỉnh này đã được sử dụng.' })
    }
    // --- Hết kiểm tra tính duy nhất ---

    // Xử lý logic khi tắt trang trạng thái
    if (!body.isEnabled) {
      body.slug = null
      body.customDomain = null // Cũng xóa custom domain khi tắt
    } else if (!body.slug) {
      throw createError({ statusCode: 400, message: 'Slug là bắt buộc khi bật trang trạng thái.' })
    }

    // Cập nhật thông tin User
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      // (Nâng cấp) Đảm bảo ghi đè toàn bộ object statusPage
      { $set: { statusPage: body } },
      { new: true, select: 'statusPage' }
    ).lean()

    if (!updatedUser) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy người dùng' })
    }

    return updatedUser.statusPage
  } catch (error: any) {
    // ... (Error handling giữ nguyên, chỉ cần thêm check 409) ...
    if (error.issues) {
      throw createError({ statusCode: 400, message: error.issues[0].message })
    }
    if (error.statusCode === 409 || error.statusCode === 400) throw error
    console.error('Lỗi cập nhật config status page:', error)
    throw createError({ statusCode: 500, message: 'Lỗi máy chủ' })
  }
})

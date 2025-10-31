import mongoose from 'mongoose'
import { getRequireUserSession, validateObjectId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { userId: currentUserId } = await getRequireUserSession(event)
  const memberIdToDelete = getRouterParam(event, 'memberId')
  validateObjectId(memberIdToDelete, 'Member ID')

  const project = await requireProjectMembership(event, { lean: false })
  requireProjectRole(project, currentUserId, ['owner', 'admin'])

  const memberToDelete = project.members.id(memberIdToDelete)
  if (!memberToDelete) {
    throw createError({ statusCode: 404, message: 'Không tìm thấy thành viên' })
  }
  if (memberToDelete.role === 'owner') {
    throw createError({ statusCode: 403, message: 'Không thể xóa Owner khỏi dự án' })
  }

  // Lấy thông tin email TRƯỚC KHI XÓA
  const emailToNotify = memberToDelete.email
  const roleWas = memberToDelete.role

  // Sử dụng .pull() để xóa sub-document khỏi mảng
  project.members.pull(memberIdToDelete)
  await project.save()

  // --- THÊM MỚI: Gửi Mail thông báo bị xóa ---
  try {
    // Tạo email template
    const emailTemplate = createMemberRemovedEmailTemplate(
      emailToNotify,
      String(project.name)
    )

    // Gửi email
    await sendMail(
      {
        to: emailToNotify,
        from: config.email.from || 'noreply@headless-sentry.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      },
      {
        host: config.email.host,
        port: Number(config.email.port),
        secure: config.email.secure || false,
        auth: {
          user: config.email.user,
          pass: config.email.pass
        }
      }
    )

    console.log(`Email thông báo xóa thành viên đã được gửi đến: ${emailToNotify}`)
  } catch (e) {
    console.error('Lỗi gửi mail (xóa thành viên):', e)
    // Không throw error để không ảnh hưởng đến việc xóa thành viên
  }
  // --- KẾT THÚC GỬI MAIL ---

  return { success: true }
})

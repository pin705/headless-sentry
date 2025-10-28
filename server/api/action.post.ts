// server/api/action.post.ts
import { z } from 'zod'
import { actions } from '../actions'

// Định nghĩa schema cho body request, yêu cầu có 'action'
const actionSchema = z.object({
  action: z.string().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9]+$/, 'Hành động không hợp lệ'),
  payload: z.any().optional()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const characterId = session?.character?._id
  if (!characterId) {
    throw createError({ statusCode: 401, message: 'Yêu cầu nhân vật để thực hiện hành động' })
  }

  const body = await readValidatedBody(event, actionSchema.parse)
  try {
    const handler = actions[body.action]

    // Lấy thông tin nhân vật để truyền vào handler
    const character = await Character.findById(characterId)
    if (!character) throw createError({ statusCode: 404, message: 'Không tìm thấy nhân vật' })

    // Thực thi handler với context cần thiết
    const result = await handler({
      character,
      payload: body.payload
    })

    // Lưu lại thay đổi của nhân vật (nếu có)
    await character.save()

    return result
  } catch (error: any) {
    // Xử lý lỗi nếu không tìm thấy handler hoặc có lỗi logic trong handler
    if (error.code === 'MODULE_NOT_FOUND') {
      throw createError({ statusCode: 404, message: `Hành động '${body.action}' không tồn tại.` })
    }
    // Ném lại lỗi từ handler (ví dụ: "Không đủ vật phẩm")
    throw createError({ statusCode: 400, message: error.message || 'Hành động thất bại' })
  }
})

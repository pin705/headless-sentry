// server/api/character/create.post.ts
import { z } from 'zod'
import { Character } from '~~/server/models/character.model'
import { Farm } from '~~/server/models/farm.model'

const bodySchema = z.object({
  name: z.string().min(3, 'Tên phải có ít nhất 3 ký tự').max(20, 'Tên không quá 20 ký tự')
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    throw createError({ statusCode: 401, message: 'Chưa đăng nhập' })
  }

  // Kiểm tra xem user đã có nhân vật chưa
  const existingCharacter = await Character.findOne({ userId: session.user.userId })
  if (existingCharacter) {
    throw createError({ statusCode: 400, message: 'Bạn đã có nhân vật rồi' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  // Bắt đầu tạo nhân vật và nông trại
  const character = await Character.create({
    userId: session.user.userId,
    name: body.name
  })

  await Farm.create({
    characterId: character._id
  })

  // Khởi tạo Tiên Phủ Lãnh Địa
  await Territory.create({
    characterId: character._id
  })

  await replaceUserSession(event, {
    ...session,
    character: {
      _id: character._id.toString(),
      name: character.name
    }
  })

  return { success: true }
})

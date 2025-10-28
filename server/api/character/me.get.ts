// server/api/character/me.get.ts
import { Character } from '~~/server/models/character.model'

export default defineEventHandler(async (event) => {
  // nuxt-auth-utils tự động inject user vào context
  const session = await getUserSession(event)
  if (!session.user?.userId) {
    return createError({ statusCode: 401, statusMessage: 'Chưa đăng nhập' })
  }

  const character = await Character.findOne({ userId: session.user.userId }).lean()

  if (!character) {
    return createError({ statusCode: 404, statusMessage: 'Không tìm thấy nhân vật' })
  }

  const enrichedInventory = enrichInventory(character.inventory as any[])

  return {
    ...character,
    inventory: enrichedInventory
  }
})

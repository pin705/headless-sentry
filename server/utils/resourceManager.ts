// server/utils/resourceManager.ts
import type { Character } from '~~/server/models/character.model'

type Cost = Partial<Record<ResourceType, number>>

/**
 * Kiểm tra xem nhân vật có đủ tài nguyên không.
 * @param character - Instance nhân vật
 * @param cost - Đối tượng chi phí, ví dụ: { linhMoc: 100, hanNgoc: 50 }
 * @returns {boolean} - True nếu đủ, false nếu không.
 */
export function hasResources(character: InstanceType<typeof Character>, cost: Cost): boolean {
  for (const [resource, amount] of Object.entries(cost)) {
    if ((character.resources.get(resource) || 0) < amount) {
      return false
    }
  }
  return true
}

/**
 * Trừ tài nguyên của nhân vật. Sẽ báo lỗi nếu không đủ.
 * @param character - Instance nhân vật
 * @param cost - Đối tượng chi phí
 */
export function spendResources(character: InstanceType<typeof Character>, cost: Cost): void {
  if (!hasResources(character, cost)) {
    // Tìm tài nguyên đầu tiên không đủ để báo lỗi cụ thể
    const missingResource = Object.keys(cost).find(res => !hasResources(character, { [res]: cost[res] }))
    throw new Error(`Không đủ ${missingResource}!`)
  }

  for (const [resource, amount] of Object.entries(cost)) {
    const currentAmount = character.resources.get(resource) || 0
    character.resources.set(resource, currentAmount - amount)
  }
}

/**
 * Cộng tài nguyên cho nhân vật.
 * @param character - Instance nhân vật
 * @param gains - Đối tượng tài nguyên nhận được
 */
export function addResources(character: InstanceType<typeof Character>, gains: Cost): void {
  for (const [resource, amount] of Object.entries(gains)) {
    const currentAmount = character.resources.get(resource) || 0
    character.resources.set(resource, currentAmount + amount)
  }
}

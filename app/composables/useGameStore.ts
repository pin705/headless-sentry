// composables/useCharacterStore.ts
import { useState, readonly } from '#imports'
import type { Character } from '~~/types/character'

export const useCharacterStore = () => {
  // Dùng useState để tạo một "linh căn" state duy nhất, đồng bộ khắp ứng dụng
  const characterState = useState<Character | null>('character-state', () => null)

  // Pháp quyết "Nhập Thể": Ghi đè toàn bộ dữ liệu nhân vật
  const setCharacter = (newCharacterData: Character | null) => {
    characterState.value = newCharacterData
  }

  // Pháp quyết "Tẩy Tủy": Cập nhật một phần dữ liệu
  const updateCharacter = (updates: Partial<Character>) => {
    if (characterState.value) {
      // Kết hợp dữ liệu cũ và mới
      characterState.value = { ...characterState.value, ...updates }
    }
  }

  // Thần thông "Thiên Lý Nhãn": Gọi API để lấy dữ liệu lần đầu
  const fetchCharacter = async () => {
    // Nếu đã có dữ liệu, không cần tìm nữa
    if (characterState.value) {
      return
    }
    try {
      const data = await $fetch<Character>('/api/character/me')
      setCharacter(data)
    } catch (error) {
      console.error('Lỗi khi tải thông tin nhân vật:', error)
      setCharacter(null) // Xóa dữ liệu nếu có lỗi
    }
  }

  return {
    // Chỉ cho phép "nhìn" vào chân thân, không cho phép thay đổi trực tiếp
    character: readonly(characterState),
    setCharacter,
    updateCharacter,
    fetchCharacter,
  }
}

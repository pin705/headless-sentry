export function useGameAction() {
  const { addLog } = useGameLog()
  // Lấy pháp quyết từ Linh Đài
  const { updateCharacter } = useCharacterStore()
  const isLoading = ref(false)
  const { setTerritory } = useTerritoryStore()

  const performAction = async <T extends { message?: string }>(action: string, payload?: any): Promise<T | null> => {
    isLoading.value = true
    try {
      const result = await $fetch<T>('/api/action', {
        method: 'POST',
        body: { action, payload }
      })

      if (result && result.message) {
        addLog(result.message, 'success')
      }

      if (result) {
        const { territory, resources, ...characterUpdates } = result as any

        // 1. Cập nhật Linh Đài Lãnh Địa nếu có
        if (territory) {
          setTerritory(territory)
        }

        // 2. Cập nhật Linh Đài Nhân Vật nếu có
        // Gộp 'resources' vào chung với các update khác của character
        const allCharacterUpdates = resources ? { ...characterUpdates, resources } : characterUpdates
        if (Object.keys(allCharacterUpdates).length > 0) {
          updateCharacter(allCharacterUpdates)
        }
      }

      return result
    } catch (e: any) {
      addLog(e.data?.message || 'Hành động thất bại.', 'error')
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    performAction,
    isLoading
  }
}

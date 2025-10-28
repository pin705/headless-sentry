// composables/useGameLog.ts
import { ref } from 'vue'

export interface LogEntry {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

// "Linh Đài" chứa các truyền âm
const logs = ref<LogEntry[]>([])

export function useGameLog() {
  /**
   * Phát ra một truyền âm mới.
   * @param message Nội dung truyền âm
   * @param type Loại (thành công, thất bại, thông thường)
   * @param duration Thời gian tồn tại (tính bằng mili giây)
   */
  const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 5000) => {
    // Tạo một định danh duy nhất cho mỗi truyền âm
    const id = Date.now() + Math.random();

    // Thêm truyền âm mới vào đầu danh sách
    logs.value.unshift({
      id,
      message,
      type,
    })

    // *** PHÁP QUYẾT TỰ ĐỘNG TIÊU TÁN ***
    // Sau một khoảng thời gian, tự động loại bỏ truyền âm này khỏi Linh Đài
    setTimeout(() => {
      logs.value = logs.value.filter(log => log.id !== id)
    }, duration)

    // Giới hạn số lượng truyền âm tối đa để tránh nhiễu loạn
    if (logs.value.length > 7) {
        logs.value.pop()
    }
  }

  return {
    logs,
    addLog,
  }
}

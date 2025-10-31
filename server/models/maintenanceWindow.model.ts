import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema } from 'mongoose'

export const MaintenanceWindow = defineMongooseModel('MaintenanceWindow', {
  projectId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true }, // Ví dụ: "Bảo trì định kỳ cuối tuần"
  description: { type: String, default: null },

  // Loại bảo trì: một lần (one-time) hoặc định kỳ (recurring)
  type: { type: String, required: true, enum: ['one-time', 'recurring'], default: 'one-time' },

  // Cho one-time: thời gian bắt đầu và kết thúc cụ thể
  startTime: { type: Date, default: null }, // Bắt đầu bảo trì
  endTime: { type: Date, default: null }, // Kết thúc bảo trì

  // Cho recurring: cron schedule (ví dụ: "0 2 * * 0" = 2:00 AM mỗi chủ nhật)
  cronSchedule: { type: String, default: null },
  duration: { type: Number, default: null }, // Thời gian bảo trì tính bằng phút

  // Trạng thái
  isActive: { type: Boolean, default: true }, // Có đang kích hoạt không

  // Ghi chú
  createdBy: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
})

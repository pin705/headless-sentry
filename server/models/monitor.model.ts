// server/models/monitor.model.ts
import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema } from 'mongoose'

export const Monitor = defineMongooseModel('Monitor', {
  userId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // Tên gợi nhớ người dùng đặt
  endpoint: { type: String, required: true }, // URL để giám sát
  method: { type: String, default: 'GET' }, // Phương thức HTTP (MVP chỉ cần GET)
  frequency: { type: Number, default: 60 }, // Tần suất kiểm tra (giây)
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'PAUSED'] }, // Trạng thái giám sát
  // Có thể mở rộng thêm locations sau
  // locations: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
})

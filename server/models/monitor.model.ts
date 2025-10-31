import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema } from 'mongoose'

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const frequencies = [60, 300, 600, 1800, 3600] // 1m, 5m, 10m, 30m, 1h
const monitorTypes = ['http', 'keyword', 'ping']

export const Monitor = defineMongooseModel('Monitor', {
  projectId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  userId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, default: 'http', enum: monitorTypes }, // Loại monitor: http, keyword, ping
  endpoint: { type: String, required: true },
  method: { type: String, default: 'GET', enum: httpMethods },
  frequency: { type: Number, default: 60, enum: frequencies }, // Tần suất (giây)
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'PAUSED'] },
  keyword: { type: String, default: null }, // Từ khóa để kiểm tra (cho loại 'keyword')

  isPublic: { type: Boolean, default: false }, // Mặc định là không công khai

  httpConfig: {
    // Chuyển từ Map sang mảng object (dễ quản lý bằng form)
    headers: [{
      key: { type: String, required: true },
      value: { type: String, required: true }
    }],
    body: { type: String, default: null }, // Vẫn là string (để lưu JSON, raw text...)
    bodyType: {
      type: String,
      default: 'none',
      enum: ['none', 'json', 'raw'] // raw = text/plain
    }
  },

  alertConfig: {
    latencyThreshold: { type: Number, default: null }, // vd: 1500 (ms)
    responseBodyCheck: { type: String, default: null }, // vd: "error": true
    errorRateThreshold: { type: Number, default: null }, // vd: 5 (%)
    channels: [{
      url: { type: String, required: true } // Webhook URL
    }],
    // (Mới) Dùng để chống spam
    lastAlertedAt: { type: Date, default: null }
  },

  ssl: {
    isValid: { type: Boolean, default: null },
    expiresAt: { type: Date, default: null }, // Ngày hết hạn
    daysRemaining: { type: Number, default: null }, // Số ngày còn lại
    errorMessage: { type: String, default: null },
    lastCheckedAt: { type: Date, default: null } // Lần cuối kiểm tra SSL
  }

}, {
  timestamps: true
})

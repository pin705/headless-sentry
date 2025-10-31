import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema } from 'mongoose'

// Lưu ý quan trọng: Collection này nên được tạo dưới dạng Time Series trên MongoDB
// Bạn cần chạy lệnh này trên mongo shell:
// db.createCollection("results", { timeseries: { timeField: "timestamp", metaField: "meta", granularity: "minutes" } })

export const Result = defineMongooseModel('Result', {
  timestamp: { type: Date, required: true }, // Dấu thời gian kiểm tra
  meta: {
    monitorId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Monitor', required: true },
    projectId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    location: { type: String, default: 'default' } // MVP chỉ cần 1 location
  },
  latency: { type: Number, required: true }, // Thời gian phản hồi (ms)
  statusCode: { type: Number, required: true }, // Mã trạng thái HTTP
  isUp: { type: Boolean, required: true }, // True nếu statusCode < 400
  errorMessage: { type: String, default: null, trim: true },
  
  // Server monitoring metrics (only for server type monitors)
  serverMetrics: {
    cpuUsage: { type: Number, default: null }, // CPU usage percentage
    memoryUsage: { type: Number, default: null }, // Memory usage percentage
    memoryUsedMB: { type: Number, default: null }, // Memory used in MB
    memoryTotalMB: { type: Number, default: null }, // Total memory in MB
    diskUsage: { type: Number, default: null }, // Disk usage percentage
    diskUsedGB: { type: Number, default: null }, // Disk used in GB
    diskTotalGB: { type: Number, default: null }, // Total disk in GB
    networkIn: { type: Number, default: null }, // Network in (bytes/s)
    networkOut: { type: Number, default: null }, // Network out (bytes/s)
    loadAverage: [{ type: Number }] // Load average [1min, 5min, 15min]
  }
}, {
  // Options cho Time Series Collection
  timeseries: {
    timeField: 'timestamp',
    metaField: 'meta',
    granularity: 'minutes' // Tối ưu lưu trữ theo phút
  },
  expireAfterSeconds: 60 * 60 * 24 * 30 // Tự động xoá data cũ sau 30 ngày (tùy chọn)
})

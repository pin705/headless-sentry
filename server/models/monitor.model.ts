// server/models/monitor.model.ts
import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema } from 'mongoose'

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const frequencies = [60, 300, 600, 1800, 3600] // 1m, 5m, 10m, 30m, 1h

export const Monitor = defineMongooseModel('Monitor', {
  userId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  endpoint: { type: String, required: true },
  method: { type: String, default: 'GET', enum: httpMethods },
  frequency: { type: Number, default: 60, enum: frequencies }, // Tần suất (giây)
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'PAUSED'] },

  // Nâng cao: Lưu trữ headers, body...
  httpConfig: {
    headers: { type: Map, of: String },
    body: { type: String } // Lưu JSON string
  }

}, {
  timestamps: true
})

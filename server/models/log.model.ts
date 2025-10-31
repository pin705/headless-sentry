import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema } from 'mongoose'

export const Log = defineMongooseModel('Log', {
  projectId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  level: { type: String, required: true, enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'], index: true },
  message: { type: String, required: true },
  metadata: { type: Object, default: {} },
  monitorId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Monitor', default: null },
  source: { type: String, default: 'application' }, // application, system, agent
  tags: [{ type: String }]
}, {
  timestamps: true,
  // Optionally enable TTL for automatic log cleanup
  expireAfterSeconds: 60 * 60 * 24 * 90 // 90 days retention
})

// Create indexes for efficient querying
Log.schema.index({ projectId: 1, timestamp: -1 })
Log.schema.index({ projectId: 1, level: 1, timestamp: -1 })

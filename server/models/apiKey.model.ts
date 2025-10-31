import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema } from 'mongoose'

export const ApiKey = defineMongooseModel('ApiKey', {
  projectId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  userId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  keyHash: { type: String, required: true, unique: true, index: true }, // Store hashed version
  keyPrefix: { type: String, required: true }, // Store first 8 chars for identification (e.g., "hs_prod_")
  permissions: [{
    type: String,
    enum: ['log:write', 'heartbeat:write', 'deployment:write', 'monitor:read', 'monitor:write']
  }],
  lastUsedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null }, // Optional expiration
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
})

// Create indexes for efficient querying
ApiKey.schema.index({ projectId: 1, isActive: 1 })
ApiKey.schema.index({ keyHash: 1, isActive: 1 })

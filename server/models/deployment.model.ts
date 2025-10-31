import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema } from 'mongoose'

export const Deployment = defineMongooseModel('Deployment', {
  projectId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  version: { type: String, required: true },
  description: { type: String, default: '' },
  environment: { type: String, default: 'production', enum: ['production', 'staging', 'development'] },
  deployedBy: { type: String, default: '' }, // Username or CI/CD system
  status: { type: String, default: 'success', enum: ['success', 'failed', 'rollback'] },
  metadata: { type: Object, default: {} } // Additional deployment info (commit hash, branch, etc.)
}, {
  timestamps: true
})

// Create indexes for efficient querying
Deployment.schema.index({ projectId: 1, timestamp: -1 })

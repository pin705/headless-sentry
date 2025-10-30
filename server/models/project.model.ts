import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema, Types } from 'mongoose'

// Định nghĩa các vai trò có thể có
const projectRoles = ['owner', 'admin', 'member'] as const
export type ProjectRole = typeof projectRoles[number]

export const Project = defineMongooseModel('Project', {
  name: { type: String, required: true },
  ownerId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [{
    userId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true }, // Lưu email để dễ hiển thị
    role: { type: String, required: true, enum: projectRoles, default: 'member' }
  }],

  statusPage: {
    isEnabled: { type: Boolean, default: false },
    slug: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, default: 'Trạng thái Dịch vụ' },
    logoUrl: { type: String, default: null },
    customDomain: { type: String, unique: true, sparse: true, trim: true, lowercase: true }
  }
}, { timestamps: true })

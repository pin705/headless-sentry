import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema, Types } from 'mongoose'

// Định nghĩa các vai trò có thể mời
const assignableRoles: ProjectRole[] = ['admin', 'member']

export const Invitation = defineMongooseModel('Invitation', {
  projectId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  role: { type: String, required: true, enum: assignableRoles, default: 'member' },
  token: { type: String, required: true, unique: true, index: true },
  invitedBy: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

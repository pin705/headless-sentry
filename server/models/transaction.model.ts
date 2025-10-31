import { defineMongooseModel } from '#nuxt/mongoose'
import type { Schema } from 'mongoose'

const transactionTypes = ['deposit', 'plan_upgrade', 'plan_renewal', 'refund'] as const
const transactionMethods = ['lemon_squeezy', 'sepay', 'manual'] as const
const transactionStatuses = ['pending', 'completed', 'failed', 'refunded'] as const

export type TransactionType = typeof transactionTypes[number]
export type TransactionMethod = typeof transactionMethods[number]
export type TransactionStatus = typeof transactionStatuses[number]

export const Transaction = defineMongooseModel('Transaction', {
  userId: { type: 'ObjectId' as unknown as Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true }, // Amount in VND
  type: { type: String, required: true, enum: transactionTypes },
  method: { type: String, required: true, enum: transactionMethods },
  status: { type: String, required: true, enum: transactionStatuses, default: 'pending' },

  // Balance tracking
  previousBalance: { type: Number, default: 0 },
  newBalance: { type: Number, default: 0 },

  // Plan upgrade details (if applicable)
  planBefore: { type: String, enum: ['free', 'pro'], default: null },
  planAfter: { type: String, enum: ['free', 'pro'], default: null },

  // Payment gateway details
  externalId: { type: String, default: null, index: true }, // Transaction ID from payment gateway
  externalData: { type: Object, default: {} }, // Raw webhook data

  // Additional info
  note: { type: String, default: null },
  metadata: { type: Object, default: {} }
}, {
  timestamps: true
})

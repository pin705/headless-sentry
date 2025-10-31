import { defineMongooseModel } from '#nuxt/mongoose'

export const User = defineMongooseModel(
  'User',
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    name: { type: String, required: true },

    avatarUrl: { type: String, default: '' },

    lastKnownIP: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    isBanned: { type: Boolean, default: false },

    // Plan and billing fields
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    balance: { type: Number, default: 0 }, // Balance in VND
    planExpiresAt: { type: Date, default: null },

    // Language preference
    language: { type: String, enum: ['vi', 'en'], default: 'vi' }
  },
  {
    timestamps: true
  }
)

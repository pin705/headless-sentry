import { defineMongooseModel } from '#nuxt/mongoose'

export const User = defineMongooseModel(
  'User',
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    lastKnownIP: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    isBanned: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
)

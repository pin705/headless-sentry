import { defineMongooseModel } from '#nuxt/mongoose'

export const User = defineMongooseModel(
  'User',
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    avatar: { type: String, default: '' },

    lastKnownIP: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    isBanned: { type: Boolean, default: false },

    statusPage: {
      isEnabled: { type: Boolean, default: false }, // Bật/tắt trang
      slug: { type: String, unique: true, sparse: true, index: true }, // Đường dẫn công khai (vd: "my-company")
      title: { type: String, default: 'Trạng thái Dịch vụ' }, // Tiêu đề trang
      logoUrl: { type: String, default: null } // URL logo tùy chỉnh
    // customDomain: { type: String, default: null } // (Nâng cao) Tên miền tùy chỉnh
    },

    customDomain: {
      type: String,
      unique: true, // Đảm bảo mỗi domain chỉ được dùng 1 lần
      sparse: true, // Cho phép nhiều giá trị null
      default: null,
      trim: true,
      lowercase: true // Lưu trữ tên miền dạng chữ thường
    }

  },
  {
    timestamps: true
  }
)

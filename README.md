# Headless Sentry

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Time%20Series-4EA94B?logo=mongodb&labelColor=001e2b)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<details>
<summary>🇻🇳 Tiếng Việt</summary>

Một hệ thống giám sát uptime và performance mạnh mẽ được xây dựng với Nuxt 3, MongoDB Time Series và AWS S3. Headless Sentry cung cấp giải pháp monitoring toàn diện cho websites và APIs của bạn với khả năng cảnh báo realtime và status page công khai.

## ✨ Tính năng chính

- 🚀 **Monitoring đa dạng**: HTTP/HTTPS endpoints, SSL certificates, error rates
- 📊 **Time Series Database**: Sử dụng MongoDB Time Series để lưu trữ dữ liệu hiệu quả
- 🔔 **Cảnh báo realtime**: Thông báo ngay khi có sự cố
- 🌐 **Status Page**: Trang trạng thái công khai cho khách hàng
- 👥 **Quản lý team**: Hỗ trợ nhiều thành viên với phân quyền
- 📈 **Dashboard trực quan**: Biểu đồ và metrics chi tiết
- 🔐 **Bảo mật**: Authentication với nuxt-auth-utils
- ⚡ **Cron Jobs**: Tự động kiểm tra theo lịch định sẵn

## 🛠️ Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **UI Framework**: Nuxt UI, TailwindCSS
- **Backend**: Nuxt Server API
- **Database**: MongoDB với Time Series collections
- **Authentication**: nuxt-auth-utils
- **Storage**: AWS S3 (presigned URLs)
- **Cron Jobs**: nuxt-cron
- **Charts**: Unovis
- **Validation**: Zod

## 📋 Yêu cầu hệ thống

- Node.js 18+ 
- pnpm (khuyến nghị)
- MongoDB 5.0+ (hỗ trợ Time Series)
- AWS S3 bucket (cho upload files)

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/pin705/headless-sentry.git
cd headless-sentry
```

### 2. Cài đặt dependencies

```bash
pnpm install
```

### 3. Cấu hình environment variables

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/headless-sentry

# Authentication (generate random strings)
NUXT_SESSION_PASSWORD=your-32-char-session-password
NUXT_OAUTH_GITHUB_CLIENT_ID=your-github-oauth-client-id
NUXT_OAUTH_GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Application
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Khởi tạo MongoDB Time Series Collection

⚠️ **Quan trọng**: Bạn cần tạo collection `results` với Time Series một lần duy nhất.

Kết nối vào MongoDB và chạy lệnh sau:

```javascript
// Chuyển sang database của bạn
use headless-sentry

// Tạo Time Series collection
db.createCollection("results", {
   timeseries: {
      timeField: "timestamp",
      metaField: "meta", 
      granularity: "minutes"
   }
})
```

Chi tiết xem trong file `NOTES.md`.

## 🔧 Development

### Khởi động development server

```bash
pnpm dev
```

Server sẽ chạy tại `http://localhost:3000`

### Các lệnh hữu ích

```bash
# Lint code
pnpm lint

# Type checking
pnpm typecheck

# Build production
pnpm build

# Preview production build
pnpm preview
```

## 📁 Cấu trúc dự án

```
├── app/
│   ├── components/          # Vue components
│   ├── pages/              # Nuxt pages & routing
│   ├── composables/        # Vue composables
│   ├── middleware/         # Route middleware
│   └── layouts/            # Layout components
├── server/
│   ├── api/                # Server API endpoints
│   ├── cron/               # Cron job definitions
│   ├── models/             # MongoDB models
│   └── utils/              # Server utilities
├── public/                 # Static assets
└── ecosystem.config.cjs    # PM2 configuration
```

## 🔄 Cron Jobs

Hệ thống sử dụng các cron job để monitoring tự động:

- **monitorCheck.cron.ts**: Kiểm tra uptime endpoints
- **sslCheck.cron.ts**: Kiểm tra SSL certificates  
- **errorRateCheck.cron.ts**: Giám sát error rates

Cron jobs chạy theo timezone `Asia/Ho_Chi_Minh` và có thể cấu hình trong `nuxt.config.ts`.

## 🚀 Production Deployment

### Sử dụng PM2

```bash
# Build application
pnpm build

# Start với PM2
pm2 start ecosystem.config.cjs

# Monitor
pm2 monit

# Stop
pm2 stop headless-sentry
```

### Docker (tùy chọn)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .output .output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

## 🌐 Status Page

Mỗi project có thể tạo status page công khai với:

- Custom slug (vd: `/status/my-service`)
- Custom domain support
- Logo và branding tùy chỉnh
- Hiển thị uptime realtime

## 🔐 Authentication

Hỗ trợ nhiều phương thức đăng nhập:

- GitHub OAuth
- Email/Password (tùy chọn)
- Session management với nuxt-auth-utils

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📝 License

Dự án này được phân phối dưới [MIT License](LICENSE).

## 🐛 Bug Reports & Feature Requests

Vui lòng tạo [GitHub Issue](https://github.com/pin705/headless-sentry/issues) để báo cáo lỗi hoặc đề xuất tính năng mới.

## 📞 Support

- 📧 Email: [your-email@domain.com]
- 💬 Discussions: [GitHub Discussions](https://github.com/pin705/headless-sentry/discussions)
- 📖 Documentation: [Wiki](https://github.com/pin705/headless-sentry/wiki)

---

⭐ Nếu dự án hữu ích, hãy cho chúng tôi một star trên GitHub!

</details>

<details open>
<summary>🇺🇸 English</summary>

A powerful uptime and performance monitoring system built with Nuxt 3, MongoDB Time Series, and AWS S3. Headless Sentry provides comprehensive monitoring solutions for your websites and APIs with real-time alerts and public status pages.

## ✨ Key Features

- 🚀 **Multi-type Monitoring**: HTTP/HTTPS endpoints, SSL certificates, error rates
- 📊 **Time Series Database**: Uses MongoDB Time Series for efficient data storage
- 🔔 **Real-time Alerts**: Instant notifications when issues occur
- 🌐 **Status Pages**: Public status pages for your customers
- 👥 **Team Management**: Multi-member support with role-based permissions
- 📈 **Visual Dashboard**: Detailed charts and metrics
- 🔐 **Security**: Authentication with nuxt-auth-utils
- ⚡ **Cron Jobs**: Automated scheduled monitoring

## 🛠️ Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **UI Framework**: Nuxt UI, TailwindCSS
- **Backend**: Nuxt Server API
- **Database**: MongoDB with Time Series collections
- **Authentication**: nuxt-auth-utils
- **Storage**: AWS S3 (presigned URLs)
- **Cron Jobs**: nuxt-cron
- **Charts**: Unovis
- **Validation**: Zod

## 📋 System Requirements

- Node.js 18+
- pnpm (recommended)
- MongoDB 5.0+ (Time Series support)
- AWS S3 bucket (for file uploads)

## 🚀 Installation

### 1. Clone repository

```bash
git clone https://github.com/pin705/headless-sentry.git
cd headless-sentry
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create `.env` file from template:

```bash
cp .env.example .env
```

Update environment variables:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/headless-sentry

# Authentication (generate random strings)
NUXT_SESSION_PASSWORD=your-32-char-session-password
NUXT_OAUTH_GITHUB_CLIENT_ID=your-github-oauth-client-id
NUXT_OAUTH_GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Application
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Initialize MongoDB Time Series Collection

⚠️ **Important**: You need to create the `results` collection with Time Series once.

Connect to MongoDB and run:

```javascript
// Switch to your database
use headless-sentry

// Create Time Series collection
db.createCollection("results", {
   timeseries: {
      timeField: "timestamp",
      metaField: "meta", 
      granularity: "minutes"
   }
})
```

See `NOTES.md` for details.

## 🔧 Development

### Start development server

```bash
pnpm dev
```

Server will run at `http://localhost:3000`

### Useful commands

```bash
# Lint code
pnpm lint

# Type checking
pnpm typecheck

# Build production
pnpm build

# Preview production build
pnpm preview
```

## 📁 Project Structure

```
├── app/
│   ├── components/          # Vue components
│   ├── pages/              # Nuxt pages & routing
│   ├── composables/        # Vue composables
│   ├── middleware/         # Route middleware
│   └── layouts/            # Layout components
├── server/
│   ├── api/                # Server API endpoints
│   ├── cron/               # Cron job definitions
│   ├── models/             # MongoDB models
│   └── utils/              # Server utilities
├── public/                 # Static assets
└── ecosystem.config.cjs    # PM2 configuration
```

## 🔄 Cron Jobs

The system uses cron jobs for automated monitoring:

- **monitorCheck.cron.ts**: Check endpoint uptime
- **sslCheck.cron.ts**: Check SSL certificates
- **errorRateCheck.cron.ts**: Monitor error rates

Cron jobs run in `Asia/Ho_Chi_Minh` timezone and can be configured in `nuxt.config.ts`.

## 🚀 Production Deployment

### Using PM2

```bash
# Build application
pnpm build

# Start with PM2
pm2 start ecosystem.config.cjs

# Monitor
pm2 monit

# Stop
pm2 stop headless-sentry
```

### Docker (optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .output .output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

## 🌐 Status Page

Each project can create public status pages with:

- Custom slug (e.g., `/status/my-service`)
- Custom domain support
- Logo and custom branding
- Real-time uptime display

## 🔐 Authentication

Supports multiple login methods:

- GitHub OAuth
- Email/Password (optional)
- Session management with nuxt-auth-utils

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

## 📝 License

This project is distributed under [MIT License](LICENSE).

## 🐛 Bug Reports & Feature Requests

Please create [GitHub Issues](https://github.com/pin705/headless-sentry/issues) to report bugs or request new features.

## 📞 Support

- 📧 Email: [your-email@domain.com]
- 💬 Discussions: [GitHub Discussions](https://github.com/pin705/headless-sentry/discussions)
- 📖 Documentation: [Wiki](https://github.com/pin705/headless-sentry/wiki)

---

⭐ If this project is helpful, please give us a star on GitHub!

</details>

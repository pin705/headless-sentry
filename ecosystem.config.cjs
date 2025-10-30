module.exports = {
  apps: [
    {
      name: 'headless-sentry',
      script: '.output/server/index.mjs',

      // Single process for monitoring service
      exec_mode: 'fork',
      instances: 1,

      // Stability & auto recovery
      watch: false,
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 5,
      exp_backoff_restart_delay: 100,

      // Memory & Performance
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=2048',

      // Logging
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/headless-sentry-error.log',
      out_file: './logs/headless-sentry-out.log',
      log_file: './logs/headless-sentry-combined.log',

      // Graceful start/stop
      wait_ready: false,
      listen_timeout: 8000,
      kill_timeout: 5000,

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Database
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/headless-sentry',

        // Authentication
        NUXT_SESSION_PASSWORD: process.env.NUXT_SESSION_PASSWORD,
        NUXT_OAUTH_GITHUB_CLIENT_ID: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
        NUXT_OAUTH_GITHUB_CLIENT_SECRET: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET,

        // AWS S3
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_REGION: process.env.AWS_REGION || 'us-east-1',
        AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,

        // Application
        NUXT_PUBLIC_APP_URL: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',

        // Timezone for cron jobs
        TZ: 'Asia/Ho_Chi_Minh'
      },

      // Development environment
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        NUXT_PUBLIC_APP_URL: 'http://localhost:3000'
      },

      // Staging environment
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        NUXT_PUBLIC_APP_URL: 'https://staging.your-domain.com'
      },

      // Production environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NUXT_PUBLIC_APP_URL: 'https://your-domain.com'
      }
    }
  ],

  // PM2 deploy configuration (optional)
  // PM2 deploy configuration (optional)
  deploy: {
    production: {
      'user': 'deploy',
      'host': 'your-server.com',
      'ref': 'origin/main',
      'repo': 'git@github.com:pin705/headless-sentry.git',
      'path': '/var/www/headless-sentry',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
}

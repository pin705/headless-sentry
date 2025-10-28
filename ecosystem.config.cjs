module.exports = {
  apps: [
    {
      name: 'Muc Than Ky',
      script: '.output/server/index.mjs',

      // Single process, no cluster
      // instances: 'max',
      exec_mode: 'fork',

      // Độ ổn định & tự phục hồi
      watch: false,
      autorestart: true,
      min_uptime: '30s', // coi là "khởi động thành công" sau 30s
      max_restarts: 10, // tránh vòng lặp restart vô hạn
      exp_backoff_restart_delay: 200, // tăng dần delay giữa các lần restart

      // Bộ nhớ & log
      // max_memory_restart: '4096M', // nâng ngưỡng restart theo RAM của máy
      // node_args: '--max-old-space-size:8192',
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Graceful start/stop (chỉ bật wait_ready nếu app có process.send("ready"))
      wait_ready: false,
      listen_timeout: 8000,
      kill_timeout: 5000,

      env: {
        PORT: 3001,
        CRYPTO_SECRET: 'day-la-mot-chuoi-bi-mat-rat-dai-va-khong-doan-duoc-cua-ban',
        NUXT_SESSION_PASSWORD: '5515035c495645f6ba1b462290658452',
        MONGODB_URI: 'mongodb+srv://cuongnd:vCCoV9OXFDFuUyDo@cluster0.ptgdomn.mongodb.net/aistory_db?authSource:admin&retryWrites:true&w:majority&appName:Cluster0',
        GOOGLE_SERVER_API_KEY: 'AIzaSyBd9FFEEXclttS4mahbfvf9zL-ghhSA1MQ',
        R2_ACCOUNT_ID: 'c8dc00dc091a2fc3f23f67b80ecada48',
        R2_ACCESS_KEY_ID: '0e77e848422d50c9805ea64619ce2c91',
        R2_SECRET_ACCESS_KEY: '37999e7aa416a0be5b8219cf3e74edc3d74ccdf966a3019bf543621b3b075e61',
        R2_BUCKET_NAME: 'loreweaver-covers',
        R2_PUBLIC_URL: 'https://pub-ace38ee6a46144ba96aaa5f8132d76c7.r2.dev'
      }
    }
  ]
}

// server/tasks/monitorCheck.cron.ts

import { defineCronHandler } from '#nuxt/cron'


export default defineCronHandler(
  () => '*/1 * * * *', // Chạy mỗi phút
  async () => {
    console.log('[Cron] Bắt đầu kiểm tra giám sát API...');
  const monitorsToRun = await Monitor.find({ status: 'ACTIVE' }).lean();

  for (const monitor of monitorsToRun) {
    const startTime = Date.now();
    let statusCode = 599; // Mã lỗi mặc định nếu không kết nối được
    let isUp = false;
    let responseStatus = 0; // Lưu status thực tế từ $fetch

    try {
      // Sử dụng $fetch của Nuxt/Nitro
       await $fetch.raw(monitor.endpoint, {
         method: monitor.method as any, // Ép kiểu nếu cần
         timeout: 15000, // Timeout 15 giây
         ignoreResponseError: true // Quan trọng: Để lấy được cả status lỗi
      }).then(res => {
        responseStatus = res.status;
        isUp = res.ok; // status 200-299
      }).catch(err => {
        // Lỗi network hoặc lỗi khác không phải HTTP status
        responseStatus = err.response?.status || 599;
        isUp = false;
        console.error(`Lỗi fetch ${monitor.endpoint}:`, err.message);
      });

      statusCode = responseStatus;

    } catch (error: any) {
       // Bắt các lỗi không mong muốn khác trong logic try
      console.error(`Lỗi không xác định khi kiểm tra ${monitor.endpoint}:`, error);
      statusCode = 599; // Mã lỗi chung
      isUp = false;
    }

    const latency = Date.now() - startTime;

    // Ghi kết quả vào Time Series Collection
    try {
       await Result.create({
        timestamp: new Date(),
        meta: {
          monitorId: monitor._id,
          userId: monitor.userId,
          location: 'default' // Thay đổi nếu có nhiều location
        },
        latency: latency,
        statusCode: statusCode,
        isUp: isUp
      });
    } catch(dbError) {
      console.error(`Lỗi ghi kết quả cho ${monitor.name}:`, dbError);
    }
  }
  console.log(`[Cron] Hoàn thành kiểm tra ${monitorsToRun.length} monitors.`);
  },
)

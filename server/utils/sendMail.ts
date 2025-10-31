import nodemailer from 'nodemailer'

export interface MailOptions {
  to: string | string[]
  from?: string
  subject: string
  html?: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
}

export type SupportedLanguage = 'vi' | 'en'

export interface SMTPConfig {
  host: string
  port: number
  secure?: boolean
  auth: {
    user: string
    pass: string
  }
}

/**
 * Gửi email sử dụng nodemailer
 */
export async function sendMail(mailOptions: MailOptions, smtpConfig: SMTPConfig) {
  console.log('smtpConfig', smtpConfig)
  try {
    // Tạo transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure ?? (smtpConfig.port === 465), // true cho port 465, false cho các port khác
      auth: smtpConfig.auth
    })

    // Verify connection configuration
    await transporter.verify()

    // Gửi mail
    const info = await transporter.sendMail({
      from: mailOptions.from,
      to: Array.isArray(mailOptions.to) ? mailOptions.to.join(', ') : mailOptions.to,
      cc: Array.isArray(mailOptions.cc) ? mailOptions.cc.join(', ') : mailOptions.cc,
      bcc: Array.isArray(mailOptions.bcc) ? mailOptions.bcc.join(', ') : mailOptions.bcc,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html
    })

    console.log('Email sent successfully:', info.messageId)
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    }
  } catch (error) {
    console.error('Error sending email:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to send email: ${errorMessage}`)
  }
}

/**
 * Template cho email thông báo xóa thành viên
 */
export function createMemberRemovedEmailTemplate(
  memberEmail: string,
  projectName: string,
  removedByName?: string
) {
  const subject = `[Headless Sentry] Bạn đã bị xóa khỏi dự án ${projectName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thông báo xóa thành viên</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        .project-name { background: #e3f2fd; padding: 8px 12px; border-radius: 4px; display: inline-block; font-weight: bold; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔒 Headless Sentry</h1>
        <p>Thông báo thay đổi quyền truy cập</p>
      </div>

      <div class="content">
        <p>Xin chào <strong>${memberEmail}</strong>,</p>

        <p>Chúng tôi xin thông báo rằng bạn đã bị xóa khỏi dự án:</p>

        <p class="project-name">📊 ${projectName}</p>

        ${removedByName ? `<p>Thao tác này được thực hiện bởi: <strong>${removedByName}</strong></p>` : ''}

        <div class="warning">
          <strong>⚠️ Lưu ý quan trọng:</strong>
          <ul>
            <li>Bạn không còn quyền truy cập vào dự án này</li>
            <li>Tất cả dữ liệu và dashboard liên quan đến dự án sẽ không thể truy cập</li>
            <li>Các thông báo monitoring từ dự án này sẽ ngừng được gửi đến email của bạn</li>
          </ul>
        </div>

        <p>Nếu bạn cho rằng đây là một sai sót, vui lòng liên hệ với quản trị viên dự án để được hỗ trợ.</p>

        <p>Cảm ơn bạn đã sử dụng Headless Sentry!</p>
      </div>

      <div class="footer">
        <p>Email này được gửi tự động từ hệ thống Headless Sentry.<br>
        Vui lòng không trả lời email này.</p>
        <p><a href="https://github.com/pin705/headless-sentry">📚 Tài liệu</a> |
        <a href="mailto:support@headless-sentry.com">💬 Hỗ trợ</a></p>
      </div>
    </body>
    </html>
  `

  const text = `
    Headless Sentry - Thông báo xóa thành viên

    Xin chào ${memberEmail},

    Bạn đã bị xóa khỏi dự án: ${projectName}
    ${removedByName ? `Thao tác này được thực hiện bởi: ${removedByName}` : ''}

    Lưu ý:
    - Bạn không còn quyền truy cập vào dự án này
    - Tất cả dữ liệu và dashboard liên quan sẽ không thể truy cập
    - Các thông báo monitoring sẽ ngừng được gửi đến email của bạn

    Nếu bạn cho rằng đây là sai sót, vui lòng liên hệ quản trị viên dự án.

    Cảm ơn bạn đã sử dụng Headless Sentry!
  `

  return { subject, html, text }
}

/**
 * Template cho email mời thành viên mới
 */
export function createMemberInvitedEmailTemplate(
  inviteeEmail: string,
  projectName: string,
  inviterName: string,
  role: string,
  inviteLink?: string
) {
  const subject = `[Headless Sentry] Bạn được mời tham gia dự án ${projectName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lời mời tham gia dự án</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        .project-info { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .role-badge { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Headless Sentry</h1>
        <p>Lời mời tham gia dự án</p>
      </div>

      <div class="content">
        <p>Xin chào <strong>${inviteeEmail}</strong>,</p>

        <p><strong>${inviterName}</strong> đã mời bạn tham gia dự án monitoring:</p>

        <div class="project-info">
          <h3>📊 ${projectName}</h3>
          <p>Vai trò của bạn: <span class="role-badge">${role.toUpperCase()}</span></p>
        </div>

        ${inviteLink
          ? `
          <p>Nhấn vào nút bên dưới để chấp nhận lời mời:</p>
          <a href="${inviteLink}" class="cta-button">🚀 Tham gia dự án</a>
        `
          : ''}

        <p><strong>Với vai trò ${role}, bạn sẽ có thể:</strong></p>
        <ul>
          ${role === 'owner'
            ? `
            <li>✅ Quản lý toàn bộ dự án</li>
            <li>✅ Thêm/xóa thành viên</li>
            <li>✅ Cấu hình tất cả monitors</li>
            <li>✅ Xem tất cả dữ liệu và báo cáo</li>
          `
            : role === 'admin'
              ? `
            <li>✅ Thêm/xóa thành viên (trừ owner)</li>
            <li>✅ Cấu hình monitors</li>
            <li>✅ Xem tất cả dữ liệu và báo cáo</li>
            <li>❌ Không thể xóa dự án</li>
          `
              : `
            <li>✅ Xem dữ liệu và báo cáo</li>
            <li>✅ Nhận thông báo monitoring</li>
            <li>❌ Không thể thêm/xóa thành viên</li>
            <li>❌ Không thể cấu hình monitors</li>
          `}
        </ul>

        <p>Headless Sentry giúp bạn giám sát uptime, performance và SSL certificates của websites một cách hiệu quả.</p>

        <p>Chào mừng bạn đến với team! 🎊</p>
      </div>

      <div class="footer">
        <p>Email này được gửi tự động từ hệ thống Headless Sentry.<br>
        Nếu bạn không mong muốn nhận email này, vui lòng bỏ qua.</p>
        <p><a href="https://github.com/pin705/headless-sentry">📚 Tài liệu</a> |
        <a href="mailto:support@headless-sentry.com">💬 Hỗ trợ</a></p>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}

/**
 * Template cho email thông báo monitor down
 */
export function createMonitorDownAlertTemplate(
  monitorName: string,
  projectName: string,
  endpoint: string,
  errorMessage: string,
  dashboardUrl?: string
) {
  const subject = `🚨 [Headless Sentry] Monitor "${monitorName}" is DOWN`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monitor Alert</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        .alert-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .monitor-info { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .cta-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 Monitor Alert</h1>
        <p>Service monitoring notification</p>
      </div>

      <div class="content">
        <div class="alert-box">
          <h2 style="color: #721c24; margin-top: 0;">⚠️ Monitor Down Detected</h2>
          <p><strong>Monitor:</strong> ${monitorName}</p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">DOWN</span></p>
        </div>

        <div class="monitor-info">
          <h3>📊 Monitor Details</h3>
          <p><strong>Endpoint:</strong> <code>${endpoint}</code></p>
          <p><strong>Error:</strong> ${errorMessage}</p>
          <p><strong>Detected at:</strong> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
        </div>

        ${dashboardUrl
          ? `
          <p>View detailed monitoring dashboard:</p>
          <a href="${dashboardUrl}" class="cta-button">📈 View Dashboard</a>
        `
          : ''}

        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Check your service status immediately</li>
          <li>Verify server logs for error details</li>
          <li>Test the endpoint manually</li>
          <li>Monitor will continue checking automatically</li>
        </ul>

        <p>This alert was generated automatically by Headless Sentry monitoring system.</p>
      </div>

      <div class="footer">
        <p>You received this alert because you're a member of the monitored project.<br>
        <a href="${dashboardUrl || '#'}">Manage notifications</a> |
        <a href="mailto:support@headless-sentry.com">Contact Support</a></p>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}

/**
 * Template cho email thông báo monitor recovered
 */
export function createMonitorRecoveredTemplate(
  monitorName: string,
  projectName: string,
  endpoint: string,
  downDuration: string,
  dashboardUrl?: string
) {
  const subject = `✅ [Headless Sentry] Monitor "${monitorName}" is RECOVERED`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monitor Recovered</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .monitor-info { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .cta-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Monitor Recovered</h1>
        <p>Service is back online</p>
      </div>

      <div class="content">
        <div class="success-box">
          <h2 style="color: #155724; margin-top: 0;">🎉 Service Restored</h2>
          <p><strong>Monitor:</strong> ${monitorName}</p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">UP</span></p>
        </div>

        <div class="monitor-info">
          <h3>📊 Recovery Details</h3>
          <p><strong>Endpoint:</strong> <code>${endpoint}</code></p>
          <p><strong>Downtime Duration:</strong> ${downDuration}</p>
          <p><strong>Recovered at:</strong> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
        </div>

        ${dashboardUrl
          ? `
          <p>View monitoring dashboard for detailed analysis:</p>
          <a href="${dashboardUrl}" class="cta-button">📈 View Dashboard</a>
        `
          : ''}

        <p>Your service is now responding normally. Headless Sentry will continue monitoring to ensure stability.</p>
      </div>

      <div class="footer">
        <p>Recovery notification from Headless Sentry monitoring system.<br>
        <a href="${dashboardUrl || '#'}">View Report</a> |
        <a href="mailto:support@headless-sentry.com">Contact Support</a></p>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}

/**
 * Template cho email thông báo SSL certificate sắp hết hạn
 */
export function createSSLExpiryWarningTemplate(
  domain: string,
  projectName: string,
  daysUntilExpiry: number,
  expiryDate: string,
  dashboardUrl?: string
) {
  const subject = `⚠️ [Headless Sentry] SSL Certificate expiring in ${daysUntilExpiry} days - ${domain}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SSL Certificate Warning</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        .warning-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .ssl-info { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .cta-button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .urgency { color: ${daysUntilExpiry <= 7 ? '#dc3545' : '#ffc107'}; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔒 SSL Certificate Warning</h1>
        <p>Certificate expiry notification</p>
      </div>

      <div class="content">
        <div class="warning-box">
          <h2 style="color: #856404; margin-top: 0;">⚠️ SSL Certificate Expiring Soon</h2>
          <p><strong>Domain:</strong> ${domain}</p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Expires in:</strong> <span class="urgency">${daysUntilExpiry} days</span></p>
        </div>

        <div class="ssl-info">
          <h3>🔐 Certificate Details</h3>
          <p><strong>Domain:</strong> <code>${domain}</code></p>
          <p><strong>Expiry Date:</strong> ${expiryDate}</p>
          <p><strong>Days Remaining:</strong> <span class="urgency">${daysUntilExpiry}</span></p>
        </div>

        ${dashboardUrl
          ? `
          <p>Monitor SSL status and get renewal reminders:</p>
          <a href="${dashboardUrl}" class="cta-button">🔒 Manage SSL</a>
        `
          : ''}

        <p><strong>Action Required:</strong></p>
        <ul>
          <li>Renew your SSL certificate before expiry</li>
          <li>Update certificate on your server</li>
          <li>Test HTTPS connectivity after renewal</li>
          <li>Configure auto-renewal if possible</li>
        </ul>

        ${daysUntilExpiry <= 7
          ? '<p style="color: #dc3545;"><strong>⚠️ URGENT:</strong> Certificate expires in less than a week. Please renew immediately to avoid service interruption.</p>'
          : ''}
      </div>

      <div class="footer">
        <p>SSL monitoring alert from Headless Sentry.<br>
        <a href="${dashboardUrl || '#'}">SSL Dashboard</a> |
        <a href="mailto:support@headless-sentry.com">Get Help</a></p>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}

/**
 * Template cho email thông báo thành viên đã là member
 */
export function createAlreadyMemberNotificationTemplate(
  userEmail: string,
  projectName: string,
  dashboardUrl?: string
) {
  const subject = `[Headless Sentry] Bạn đã ở trong dự án ${projectName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thông báo thành viên</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        .info-box { background: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ℹ️ Headless Sentry</h1>
        <p>Thông báo về tình trạng thành viên</p>
      </div>

      <div class="content">
        <p>Xin chào <strong>${userEmail}</strong>,</p>

        <div class="info-box">
          <h2 style="color: #0c5460; margin-top: 0;">✅ Bạn đã là thành viên</h2>
          <p>Bạn vừa chấp nhận lời mời vào dự án <strong>${projectName}</strong>, nhưng hệ thống ghi nhận bạn đã là thành viên của dự án này.</p>
        </div>

        <p>Không có gì cần làm thêm. Bạn có thể truy cập dự án ngay bây giờ.</p>

        ${dashboardUrl
          ? `
          <p>Truy cập dashboard của dự án:</p>
          <a href="${dashboardUrl}" class="cta-button">📊 Xem Dashboard</a>
        `
          : ''}

        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với quản trị viên dự án.</p>
      </div>

      <div class="footer">
        <p>Email này được gửi tự động từ hệ thống Headless Sentry.<br>
        <a href="https://github.com/pin705/headless-sentry">📚 Tài liệu</a> |
        <a href="mailto:support@headless-sentry.com">💬 Hỗ trợ</a></p>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}

/**
 * Template cho email chào mừng thành viên mới
 */
export function createWelcomeNewMemberTemplate(
  userEmail: string,
  projectName: string,
  role: string,
  dashboardUrl?: string
) {
  const subject = `[Headless Sentry] Chào mừng bạn đến với dự án ${projectName}! 🎉`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chào mừng thành viên mới</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        .welcome-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .role-badge { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .feature-list { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .cta-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Chào mừng đến với Headless Sentry!</h1>
        <p>Bạn đã chính thức tham gia team</p>
      </div>

      <div class="content">
        <p>Xin chào <strong>${userEmail}</strong>,</p>

        <div class="welcome-box">
          <h2 style="color: #155724; margin-top: 0;">✨ Chào mừng bạn!</h2>
          <p>Bạn đã chấp nhận thành công lời mời và trở thành thành viên của dự án <strong>${projectName}</strong>.</p>
          <p>Vai trò của bạn: <span class="role-badge">${role.toUpperCase()}</span></p>
        </div>

        <div class="feature-list">
          <h3>🚀 Với vai trò ${role}, bạn có thể:</h3>
          <ul>
            ${role === 'owner'
              ? `
              <li>✅ Quản lý toàn bộ dự án và cài đặt</li>
              <li>✅ Thêm/xóa thành viên và phân quyền</li>
              <li>✅ Tạo và cấu hình tất cả monitors</li>
              <li>✅ Xem toàn bộ dữ liệu và báo cáo chi tiết</li>
              <li>✅ Cấu hình status page công khai</li>
            `
              : role === 'admin'
                ? `
              <li>✅ Thêm/xóa thành viên (trừ owner)</li>
              <li>✅ Tạo và cấu hình monitors</li>
              <li>✅ Xem toàn bộ dữ liệu và báo cáo</li>
              <li>✅ Quản lý cài đặt dự án</li>
              <li>❌ Không thể xóa dự án</li>
            `
                : `
              <li>✅ Xem dữ liệu monitoring và báo cáo</li>
              <li>✅ Nhận thông báo khi có sự cố</li>
              <li>✅ Truy cập dashboard và metrics</li>
              <li>❌ Không thể thêm/xóa thành viên</li>
              <li>❌ Không thể cấu hình monitors</li>
            `}
          </ul>
        </div>

        ${dashboardUrl
          ? `
          <p>Bắt đầu khám phá dashboard và tính năng monitoring ngay:</p>
          <a href="${dashboardUrl}" class="cta-button">🎯 Vào Dashboard</a>
        `
          : ''}

        <h3>📚 Bước tiếp theo:</h3>
        <ol>
          <li>Khám phá dashboard và các monitors hiện có</li>
          <li>Thiết lập thông báo email/webhook (nếu có quyền)</li>
          <li>Tìm hiểu về các loại monitor: HTTP, SSL, Error Rate</li>
          <li>Xem báo cáo uptime và performance</li>
        </ol>

        <p>Nếu bạn cần hỗ trợ, đừng ngần ngại liên hệ với team hoặc tham khảo tài liệu.</p>

        <p><strong>Chào mừng bạn đến với team! 🚀</strong></p>
      </div>

      <div class="footer">
        <p>Bạn đã chính thức trở thành thành viên của <strong>${projectName}</strong>.<br>
        <a href="https://github.com/pin705/headless-sentry">📚 Tài liệu</a> |
        <a href="${dashboardUrl || '#'}">📊 Dashboard</a> |
        <a href="mailto:support@headless-sentry.com">💬 Hỗ trợ</a></p>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}

/**
 * Get base email template with modern styling
 */
function getEmailBaseTemplate(content: string, lang: SupportedLanguage = 'vi') {
  const translations = {
    vi: {
      footer: 'Email này được gửi tự động từ hệ thống Headless Sentry.',
      noReply: 'Vui lòng không trả lời email này.',
      docs: 'Tài liệu',
      support: 'Hỗ trợ',
      unsubscribe: 'Hủy đăng ký'
    },
    en: {
      footer: 'This email was sent automatically from Headless Sentry system.',
      noReply: 'Please do not reply to this email.',
      docs: 'Documentation',
      support: 'Support',
      unsubscribe: 'Unsubscribe'
    }
  }

  const t = translations[lang]

  return `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Headless Sentry</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background-color: #f9fafb;
          padding: 20px;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          padding: 40px 30px;
          text-align: center;
        }
        .email-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .email-header p {
          font-size: 16px;
          opacity: 0.95;
        }
        .email-content {
          padding: 40px 30px;
        }
        .email-footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .email-footer p {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 12px;
        }
        .email-footer a {
          color: #667eea;
          text-decoration: none;
          margin: 0 8px;
        }
        .email-footer a:hover {
          text-decoration: underline;
        }
        .button {
          display: inline-block;
          padding: 12px 32px;
          background: #667eea;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          transition: background 0.3s;
        }
        .button:hover {
          background: #5568d3;
        }
        .info-box {
          background: #f3f4f6;
          border-left: 4px solid #667eea;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .success-box {
          background: #d1fae5;
          border-left: 4px solid #10b981;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .warning-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .error-box {
          background: #fee2e2;
          border-left: 4px solid #ef4444;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        h2 {
          font-size: 24px;
          color: #111827;
          margin-bottom: 16px;
        }
        h3 {
          font-size: 18px;
          color: #374151;
          margin-bottom: 12px;
        }
        p {
          margin-bottom: 16px;
          color: #4b5563;
        }
        ul {
          margin-left: 20px;
          margin-bottom: 16px;
        }
        li {
          margin-bottom: 8px;
          color: #4b5563;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-info { background: #dbeafe; color: #1e40af; }
        @media only screen and (max-width: 600px) {
          .email-container { border-radius: 0; }
          .email-header, .email-content, .email-footer { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        ${content}
        <div class="email-footer">
          <p>${t.footer}<br>${t.noReply}</p>
          <p>
            <a href="https://github.com/pin705/headless-sentry">📚 ${t.docs}</a> |
            <a href="mailto:support@headless-sentry.com">💬 ${t.support}</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Template for payment success notification
 */
export function createPaymentSuccessTemplate(
  userEmail: string,
  amount: number,
  transactionId: string,
  plan: string,
  expiryDate: Date,
  lang: SupportedLanguage = 'vi'
) {
  const translations = {
    vi: {
      subject: '[Headless Sentry] Thanh toán thành công',
      title: '✅ Thanh toán Thành Công',
      subtitle: 'Giao dịch của bạn đã được xử lý thành công',
      greeting: 'Xin chào',
      thankYou: 'Cảm ơn bạn đã thanh toán!',
      transactionDetails: 'Chi tiết giao dịch',
      transactionId: 'Mã giao dịch',
      amount: 'Số tiền',
      date: 'Ngày giao dịch',
      planUpgraded: 'Gói của bạn đã được nâng cấp thành công',
      enjoyFeatures: `Bạn giờ có thể truy cập tất cả các tính năng của gói ${plan.toUpperCase()}.`,
      validUntil: 'Có hiệu lực đến',
      viewDashboard: '🎯 Vào Dashboard',
      regards: 'Trân trọng,<br>Đội ngũ Headless Sentry'
    },
    en: {
      subject: '[Headless Sentry] Payment Successful',
      title: '✅ Payment Successful',
      subtitle: 'Your transaction has been processed successfully',
      greeting: 'Hello',
      thankYou: 'Thank you for your payment!',
      transactionDetails: 'Transaction Details',
      transactionId: 'Transaction ID',
      amount: 'Amount',
      date: 'Transaction Date',
      planUpgraded: 'Your plan has been successfully upgraded',
      enjoyFeatures: `You can now access all features of the ${plan.toUpperCase()} plan.`,
      validUntil: 'Valid until',
      viewDashboard: '🎯 Go to Dashboard',
      regards: 'Best regards,<br>Headless Sentry Team'
    }
  }

  const t = translations[lang]
  const formattedAmount = new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
  const formattedDate = new Date().toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')
  const formattedExpiry = expiryDate.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')

  const content = `
    <div class="email-header">
      <h1>${t.title}</h1>
      <p>${t.subtitle}</p>
    </div>
    <div class="email-content">
      <p>${t.greeting} <strong>${userEmail}</strong>,</p>
      <p>${t.thankYou}</p>

      <div class="success-box">
        <h3>${t.planUpgraded}</h3>
        <p>${t.enjoyFeatures}</p>
        <p><strong>${t.validUntil}:</strong> ${formattedExpiry}</p>
      </div>

      <div class="info-box">
        <h3>${t.transactionDetails}</h3>
        <p style="margin-bottom: 8px;"><strong>${t.transactionId}:</strong> ${transactionId}</p>
        <p style="margin-bottom: 8px;"><strong>${t.amount}:</strong> ${formattedAmount}</p>
        <p style="margin-bottom: 0;"><strong>${t.date}:</strong> ${formattedDate}</p>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
          ${t.viewDashboard}
        </a>
      </div>

      <p>${t.regards}</p>
    </div>
  `

  return {
    subject: t.subject,
    html: getEmailBaseTemplate(content, lang)
  }
}

/**
 * Template for payment failure notification
 */
export function createPaymentFailureTemplate(
  userEmail: string,
  amount: number,
  reason: string,
  lang: SupportedLanguage = 'vi'
) {
  const translations = {
    vi: {
      subject: '[Headless Sentry] Thanh toán thất bại',
      title: '❌ Thanh toán Thất Bại',
      subtitle: 'Rất tiếc, giao dịch của bạn không thể hoàn tất',
      greeting: 'Xin chào',
      sorryMessage: 'Chúng tôi rất tiếc phải thông báo rằng giao dịch của bạn không thành công.',
      reason: 'Lý do',
      amount: 'Số tiền',
      tryAgain: 'Vui lòng thử lại hoặc sử dụng phương thức thanh toán khác.',
      contactSupport: 'Nếu vấn đề vẫn tiếp diễn, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi.',
      tryAgainButton: '🔄 Thử lại',
      regards: 'Trân trọng,<br>Đội ngũ Headless Sentry'
    },
    en: {
      subject: '[Headless Sentry] Payment Failed',
      title: '❌ Payment Failed',
      subtitle: 'Unfortunately, your transaction could not be completed',
      greeting: 'Hello',
      sorryMessage: 'We regret to inform you that your transaction was unsuccessful.',
      reason: 'Reason',
      amount: 'Amount',
      tryAgain: 'Please try again or use a different payment method.',
      contactSupport: 'If the problem persists, please contact our support team.',
      tryAgainButton: '🔄 Try Again',
      regards: 'Best regards,<br>Headless Sentry Team'
    }
  }

  const t = translations[lang]
  const formattedAmount = new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)

  const content = `
    <div class="email-header">
      <h1>${t.title}</h1>
      <p>${t.subtitle}</p>
    </div>
    <div class="email-content">
      <p>${t.greeting} <strong>${userEmail}</strong>,</p>
      <p>${t.sorryMessage}</p>

      <div class="error-box">
        <p style="margin-bottom: 8px;"><strong>${t.amount}:</strong> ${formattedAmount}</p>
        <p style="margin-bottom: 0;"><strong>${t.reason}:</strong> ${reason}</p>
      </div>

      <p>${t.tryAgain}</p>
      <p>${t.contactSupport}</p>

      <div style="text-align: center;">
        <a href="${process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing" class="button">
          ${t.tryAgainButton}
        </a>
      </div>

      <p>${t.regards}</p>
    </div>
  `

  return {
    subject: t.subject,
    html: getEmailBaseTemplate(content, lang)
  }
}

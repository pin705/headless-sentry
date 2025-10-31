# New Features Documentation

## Multi-Language Support (i18n)

### Overview
The system now supports both Vietnamese (vi) and English (en) languages across the entire application.

### Features
- **Automatic language detection** from user preferences
- **Language switcher** in the navigation bar
- **Backend language support** for emails and API responses
- **User language preference** stored in database

### Usage

#### For Users
1. Click the language switcher in the top navigation bar
2. Select your preferred language (Vietnamese or English)
3. The system will remember your choice

#### For Developers

**Frontend (Vue/Nuxt):**
```vue
<template>
  <div>
    <h1>{{ t('common.welcome') }}</h1>
    <p>{{ t('payment.history') }}</p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
```

**Backend (Email Templates):**
```typescript
import { createPaymentSuccessTemplate } from '~~/server/utils/sendMail'
import { getLanguageForUser } from '~~/server/utils/i18n'

// Get user's preferred language
const userLang = await getLanguageForUser(userId, userEmail)

// Create email with user's language
const emailTemplate = createPaymentSuccessTemplate(
  email,
  amount,
  transactionId,
  plan,
  expiryDate,
  userLang // 'vi' or 'en'
)
```

### Adding New Translations
1. Edit `locales/vi.json` for Vietnamese
2. Edit `locales/en.json` for English
3. Keep the same key structure in both files

Example:
```json
{
  "myFeature": {
    "title": "My Feature Title",
    "description": "Feature description"
  }
}
```

## Payment History

### Overview
Users can now view their complete payment and transaction history with filtering and pagination.

### Features
- **Transaction history** with pagination
- **Balance display** showing current account balance
- **Filter by type**: deposits, plan upgrades, renewals, refunds
- **Detailed information**: date, amount, method, status, notes
- **Responsive design** for mobile and desktop

### Accessing Payment History
1. Click your user menu in the top right
2. Select "Lịch sử thanh toán" / "Payment History"
3. Or navigate directly to `/payment-history`

### API Endpoint
```
GET /api/user/transactions?page=1&limit=20
```

Response:
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

## Improved Email Templates

### Overview
All email templates have been redesigned with a modern, professional look and multi-language support.

### Available Templates

#### 1. Payment Success
Sent when a payment is successfully processed:
- Plan upgrade via balance
- Plan upgrade via Lemon Squeezy
- Deposit via Sepay

#### 2. Payment Failure
Sent when a payment fails:
- Includes error reason
- Suggests next steps

#### 3. Existing Templates (Updated)
- Member removed notification
- Member invited notification
- Monitor down alert
- Monitor recovered notification
- SSL expiry warning
- Already member notification
- Welcome new member

### Email Template Features
- **Responsive design** for all devices
- **Modern styling** with gradients and rounded corners
- **Color-coded alerts**: success (green), warning (yellow), error (red)
- **Multi-language support**: Vietnamese and English
- **Consistent branding** across all emails

### Template Usage
```typescript
import { 
  createPaymentSuccessTemplate,
  createPaymentFailureTemplate,
  sendMail 
} from '~~/server/utils/sendMail'

// Create email template
const emailTemplate = createPaymentSuccessTemplate(
  userEmail,
  amount,
  transactionId,
  plan,
  expiryDate,
  'vi' // or 'en'
)

// Send email
await sendMail(
  {
    to: userEmail,
    from: config.email.from,
    subject: emailTemplate.subject,
    html: emailTemplate.html
  },
  smtpConfig
)
```

## Backend Language Support

### Overview
The backend now automatically detects and uses the user's preferred language for all communications.

### Features
- **User language preference** stored in database
- **Automatic language detection** from email domain
- **Language-aware email sending**
- **API endpoint** to update language preference

### API Endpoints

#### Update Language Preference
```
PUT /api/user/language
Content-Type: application/json

{
  "language": "vi" // or "en"
}
```

Response:
```json
{
  "success": true,
  "message": "Language preference updated successfully",
  "language": "vi"
}
```

### Language Detection Logic
1. **User preference** (from database) - highest priority
2. **Email domain detection** (.vn domains default to Vietnamese)
3. **Default** to Vietnamese

### Example Usage
```typescript
import { getLanguageForUser } from '~~/server/utils/i18n'

// Get user's preferred language
const userLang = await getLanguageForUser(userId, userEmail)
// Returns 'vi' or 'en'

// Use in email templates, API responses, etc.
```

## Database Schema Updates

### User Model
Added new field:
```typescript
{
  language: { type: String, enum: ['vi', 'en'], default: 'vi' }
}
```

### Transaction Model
No changes, but now fully integrated with:
- Payment history page
- Email notifications
- Multi-language support

## Testing

### Frontend Testing
1. Navigate to `/payment-history`
2. Switch language using the language switcher
3. Verify all text is translated
4. Check transaction list displays correctly

### Backend Testing
1. Make a test payment/upgrade
2. Verify email is sent in correct language
3. Check transaction is recorded in database
4. Verify API endpoints return correct data

### Email Template Testing
To test email templates locally:
1. Configure SMTP settings in `.env`
2. Make a test payment
3. Check email inbox for notification
4. Verify styling and content are correct

## Configuration

### Environment Variables
Required for email functionality:
```bash
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@headless-sentry.com
```

### i18n Configuration
Located in `nuxt.config.ts`:
```typescript
i18n: {
  locales: [
    { code: 'vi', name: 'Tiếng Việt', files: ['vi.json'] },
    { code: 'en', name: 'English', files: ['en.json'] }
  ],
  defaultLocale: 'vi',
  strategy: 'no_prefix'
}
```

## Future Enhancements

### Potential Improvements
1. Add more languages (Chinese, Japanese, etc.)
2. Export transaction history to CSV/PDF
3. Advanced filtering (date range, amount range)
4. Transaction search functionality
5. Email templates for more events
6. SMS notifications (multi-language)
7. In-app notifications (multi-language)

## Support

For issues or questions:
- Create a GitHub issue
- Contact: support@headless-sentry.com
- Documentation: https://github.com/pin705/headless-sentry

## License
MIT License - See LICENSE file for details

# Migration Guide: Multi-Language & Payment History Update

## Overview
This update adds multi-language support and payment history tracking to Headless Sentry. Existing installations need to perform a one-time database migration.

## Database Changes

### User Collection
A new `language` field has been added to store user language preferences.

**Migration Script (MongoDB Shell):**
```javascript
// Connect to your database
use headless-sentry

// Add language field to all existing users (defaults to Vietnamese)
db.users.updateMany(
  { language: { $exists: false } },
  { $set: { language: 'vi' } }
)

// Verify the update
db.users.find({ language: { $exists: true } }).count()
```

## NPM Dependencies

### New Dependencies
- `@nuxtjs/i18n` - Multi-language support

**Installation:**
```bash
npm install @nuxtjs/i18n
# or
pnpm install @nuxtjs/i18n
```

## Configuration Updates

### Environment Variables
Ensure these are set in your `.env` file for email functionality:

```bash
# Email Configuration (required for payment notifications)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@headless-sentry.com

# Application URL (used in email links)
NUXT_PUBLIC_APP_URL=https://your-domain.com
```

### Nuxt Config
The `nuxt.config.ts` has been updated with i18n configuration. If you have a custom config, merge these changes:

```typescript
export default defineNuxtConfig({
  modules: [
    // ... existing modules
    '@nuxtjs/i18n'
  ],
  
  i18n: {
    locales: [
      { code: 'vi', name: 'Tiếng Việt', files: ['vi.json'] },
      { code: 'en', name: 'English', files: ['en.json'] }
    ],
    langDir: 'locales',
    defaultLocale: 'vi',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
})
```

## File Structure Changes

### New Files
```
locales/
├── vi.json          # Vietnamese translations
└── en.json          # English translations

app/
├── components/
│   └── LanguageSwitcher.vue  # Language switcher component
└── pages/
    └── payment-history.vue   # Payment history page

server/
├── api/
│   └── user/
│       ├── transactions.get.ts  # Transaction history API
│       └── language.put.ts      # Language preference API
└── utils/
    └── i18n.ts      # Language utilities
```

### Modified Files
- `server/utils/sendMail.ts` - Enhanced with new templates
- `server/models/user.model.ts` - Added language field
- `server/api/user/plan/upgrade.post.ts` - Added email notifications
- `server/api/webhooks/lemon-squeezy.post.ts` - Added email notifications
- `server/api/webhooks/sepay.post.ts` - Added email notifications
- `app/layouts/default.vue` - Added language switcher
- `app/components/UserMenu.vue` - Added payment history link
- `app/pages/pricing.vue` - Added i18n support
- `nuxt.config.ts` - Added i18n module

## Post-Migration Steps

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Run Database Migration
```bash
# Use the MongoDB shell script above
mongo your-connection-string migration.js
```

### 3. Restart Application
```bash
# Development
npm run dev

# Production with PM2
pm2 restart headless-sentry
```

### 4. Verify Installation

**Check Language Switcher:**
1. Log in to your application
2. Look for the language switcher in the top navigation
3. Try switching between Vietnamese and English

**Check Payment History:**
1. Click your user menu
2. Select "Lịch sử thanh toán" / "Payment History"
3. Verify transactions are displayed (if any exist)

**Check Email Templates:**
1. Make a test payment or upgrade
2. Verify you receive an email notification
3. Check that the email uses your preferred language

## Breaking Changes

### None
This update is backward compatible. All existing functionality continues to work as before.

## Rollback Instructions

If you need to rollback:

### 1. Remove i18n Module
```bash
npm uninstall @nuxtjs/i18n
```

### 2. Revert Git Changes
```bash
git checkout HEAD~1 nuxt.config.ts
git checkout HEAD~1 server/models/user.model.ts
# Revert other modified files as needed
```

### 3. Remove New Files
```bash
rm -rf locales/
rm app/pages/payment-history.vue
rm app/components/LanguageSwitcher.vue
rm server/api/user/transactions.get.ts
rm server/api/user/language.put.ts
rm server/utils/i18n.ts
```

### 4. Restart Application
```bash
npm install
pm2 restart headless-sentry
```

## Troubleshooting

### Language Switcher Not Appearing
**Cause:** i18n module not properly installed or configured

**Solution:**
1. Verify `@nuxtjs/i18n` is in `package.json`
2. Check `nuxt.config.ts` has i18n configuration
3. Ensure `locales/` directory exists with translation files
4. Run `npm install` and restart

### Payment History Page Returns 404
**Cause:** Page file not properly created

**Solution:**
1. Verify `app/pages/payment-history.vue` exists
2. Check file permissions
3. Restart development server

### Email Notifications Not Sending
**Cause:** Missing or incorrect email configuration

**Solution:**
1. Check `.env` file has all EMAIL_* variables
2. Verify SMTP credentials are correct
3. Check server logs for email errors
4. Test SMTP connection manually

### Transactions Not Appearing
**Cause:** No transactions in database or API error

**Solution:**
1. Check MongoDB for transactions collection
2. Verify API endpoint `/api/user/transactions` works
3. Check browser console for errors
4. Verify user authentication

### Language Not Persisting
**Cause:** Cookie not being set or database not updating

**Solution:**
1. Check browser accepts cookies
2. Verify `/api/user/language` endpoint works
3. Check MongoDB user document has language field
4. Clear browser cache and cookies

## Support

### Getting Help
- Check FEATURES.md for detailed feature documentation
- Review server logs for error messages
- Create a GitHub issue with:
  - Node.js version
  - MongoDB version
  - Error messages
  - Steps to reproduce

### Community
- GitHub Issues: https://github.com/pin705/headless-sentry/issues
- Discussions: https://github.com/pin705/headless-sentry/discussions

## Version Information

**Update Version:** 2.0.0
**Release Date:** 2025-10-31
**Minimum Requirements:**
- Node.js: 18+
- MongoDB: 5.0+
- pnpm: 10+ (or npm 8+)

## Changelog

### Added
- Multi-language support (Vietnamese & English)
- Payment history page with pagination
- Professional email templates for payments
- Language preference system
- Language switcher component
- Backend language detection utilities
- API endpoints for transactions and language preference

### Changed
- Email templates redesigned with modern styling
- User model updated with language field
- Webhook handlers now send email notifications
- Navigation enhanced with language switcher
- UserMenu updated with payment history link

### Fixed
- None (new features only)

## Next Steps

After successful migration:
1. Review the FEATURES.md for detailed usage information
2. Customize email templates if needed (server/utils/sendMail.ts)
3. Add more language translations to locales/ directory
4. Test all payment workflows
5. Configure monitoring for new features

---

**Last Updated:** 2025-10-31
**Migration Required:** Yes (database schema update)
**Downtime Required:** No

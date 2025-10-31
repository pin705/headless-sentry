# 🆕 New Features in Headless Sentry v2.0

## 🌍 Multi-Language Support

Headless Sentry now supports both **Vietnamese** and **English** across the entire application!

### Features
- 🇻🇳 **Vietnamese** (Default)
- 🇬🇧 **English**
- 🔄 **Easy Language Switching** - One-click language change in the navigation bar
- 💾 **Persistent Preference** - Your language choice is saved to your account
- 📧 **Multi-Language Emails** - All notifications use your preferred language

### How to Use
1. Look for the language switcher in the top navigation bar
2. Click to select your preferred language
3. The entire app instantly updates to your chosen language
4. Your preference is automatically saved

---

## 💳 Payment History

Track all your transactions and payments in one place!

### What's New
A dedicated **Payment History** page that shows:
- 📊 **All Transactions** - Complete history of deposits, upgrades, and renewals
- 💰 **Current Balance** - See your account balance at a glance
- 🔍 **Filter & Search** - Filter by transaction type
- 📄 **Pagination** - Easy navigation through transaction history
- 📱 **Mobile Friendly** - Responsive design for all devices

### Features
- **Transaction Details:**
  - Date and time
  - Amount (in VND)
  - Payment method (Lemon Squeezy, Sepay, Balance)
  - Transaction type (Deposit, Upgrade, Renewal, Refund)
  - Status (Pending, Completed, Failed)
  - Notes and descriptions

- **Current Balance Card:**
  - Prominently displays your account balance
  - Quick access to pricing page

### How to Access
1. Click your user menu (top right corner)
2. Select "Lịch sử thanh toán" / "Payment History"
3. Or visit directly: `/payment-history`

---

## 📧 Professional Email Templates

All email templates have been redesigned with a modern, professional look!

### New Email Designs
- ✅ **Payment Success** - Confirmation emails for successful payments
- ❌ **Payment Failure** - Helpful notifications when payments fail
- 🎨 **Modern Design** - Gradient headers, clean layout, responsive design
- 🎨 **Color-Coded Alerts** - Visual distinction for different message types
- 📱 **Mobile Optimized** - Looks great on all devices

### Email Features
- **Multi-Language Support** - Automatically uses your preferred language
- **Professional Styling:**
  - Modern gradient headers
  - Clean, readable typography
  - Color-coded message boxes (Success: Green, Error: Red, Warning: Yellow, Info: Blue)
  - Responsive design for mobile devices
  - Call-to-action buttons
  - Footer with helpful links

### When You'll Receive Emails
1. **Successful Payment** - When you upgrade your plan or add funds
2. **Failed Payment** - If a payment doesn't go through
3. **Existing Notifications** - All enhanced with the new design:
   - Team invitations
   - Monitor alerts
   - SSL warnings
   - Member notifications

---

## 🔧 Backend Multi-Language Support

The backend now intelligently handles multiple languages!

### Features
- 🤖 **Automatic Detection** - Detects your preferred language from:
  1. Your saved preference
  2. Your email domain (.vn = Vietnamese)
  3. Defaults to Vietnamese
- 💾 **Database Storage** - Your language preference is stored in your account
- 📬 **Language-Aware Emails** - All system emails use your preferred language
- 🔌 **API Support** - Endpoints to get and update language preferences

### API Endpoints

**Get Transaction History:**
```http
GET /api/user/transactions?page=1&limit=20
```

**Update Language Preference:**
```http
PUT /api/user/language
Content-Type: application/json

{
  "language": "vi"  // or "en"
}
```

---

## 🎯 Quick Start Guide

### For New Users
1. Register for an account
2. Choose your preferred language from the language switcher
3. Make a payment to see the new email templates
4. View your transaction history at `/payment-history`

### For Existing Users
1. Update your installation (see MIGRATION.md)
2. Run the database migration
3. Your language will default to Vietnamese
4. Use the language switcher to change to English if preferred
5. All your existing transactions are visible in Payment History

---

## 📱 Screenshots

### Payment History Page
```
┌─────────────────────────────────────────────────────┐
│  Payment History                    [Back Button]   │
│  Review all your transactions and payments          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Current Balance: 500,000 VND     [Wallet Icon]     │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Payment History          [Filter: All ▼]           │
├──────┬──────────┬────────┬────────────┬──────────┬──┤
│ Date │   Type   │ Method │   Amount   │  Status  │  │
├──────┼──────────┼────────┼────────────┼──────────┼──┤
│10/31 │ Upgrade  │ Sepay  │ -200,000 ₫ │Completed │  │
│10/25 │ Deposit  │ Sepay  │ +500,000 ₫ │Completed │  │
│10/20 │ Renewal  │ Balance│ -200,000 ₫ │Completed │  │
└──────┴──────────┴────────┴────────────┴──────────┴──┘
```

### Language Switcher
```
┌───────────────────────────────────┐
│ [🌐 Tiếng Việt ▼]                 │
│                                   │
│  Projects    Monitoring           │
└───────────────────────────────────┘
  ↓ (Click)
┌───────────────────────────────────┐
│ [🌐 Language ▼]                   │
│  ┌─────────────────────┐          │
│  │ 🇻🇳 Tiếng Việt      │          │
│  │ 🇬🇧 English      ✓  │          │
│  └─────────────────────┘          │
└───────────────────────────────────┘
```

### Email Template (Payment Success)
```
╔═══════════════════════════════════════╗
║  ✅ Payment Successful                ║
║  Your transaction has been processed  ║
╠═══════════════════════════════════════╣
║                                       ║
║  Hello user@example.com,              ║
║                                       ║
║  Thank you for your payment!          ║
║                                       ║
║  ┌─────────────────────────────────┐ ║
║  │ Your plan has been upgraded     │ ║
║  │ You can now access all features │ ║
║  │ Valid until: 11/30/2025         │ ║
║  └─────────────────────────────────┘ ║
║                                       ║
║  Transaction Details                  ║
║  • Transaction ID: 123456789          ║
║  • Amount: 200,000 VND                ║
║  • Date: 10/31/2025 10:30 AM          ║
║                                       ║
║       [Go to Dashboard]               ║
║                                       ║
║  Best regards,                        ║
║  Headless Sentry Team                 ║
║                                       ║
╠═══════════════════════════════════════╣
║  Docs | Support                       ║
╚═══════════════════════════════════════╝
```

---

## 🔐 Privacy & Security

- ✅ All transactions are private and only visible to you
- ✅ Language preference is stored securely in your account
- ✅ Emails are sent via secure SMTP
- ✅ No sensitive data is exposed in logs or emails (except amounts)
- ✅ All endpoints require authentication

---

## 🌟 Benefits

### For Users
- **Better User Experience** - Use the app in your preferred language
- **Financial Transparency** - Track all your transactions easily
- **Professional Communications** - Receive beautiful, informative emails
- **Mobile Friendly** - Access payment history on any device

### For Developers
- **Easy to Extend** - Add more languages with simple JSON files
- **Type-Safe** - Full TypeScript support
- **Well Documented** - Comprehensive docs and examples
- **Modular Design** - Clean separation of concerns

---

## 📚 Documentation

Comprehensive documentation is available:

1. **FEATURES.md** - Detailed feature guide with examples
2. **MIGRATION.md** - Step-by-step migration instructions
3. **IMPLEMENTATION_SUMMARY.md** - Complete technical overview

---

## 🚀 What's Next?

We're continuously improving Headless Sentry. Upcoming features may include:

- 🌏 More languages (Chinese, Japanese, Korean)
- 📊 Advanced analytics and reports
- 💾 Export transactions to CSV/PDF
- 🔍 Advanced search and filtering
- 📱 Mobile app
- 🔔 Real-time notifications

---

## 🤝 Contributing

Want to help improve Headless Sentry?

- **Add Translations** - Help us support more languages
- **Report Bugs** - Create GitHub issues
- **Suggest Features** - Share your ideas in Discussions
- **Improve Docs** - Help make documentation better

---

## 💬 Support

Need help?

- 📖 **Documentation**: Check FEATURES.md and MIGRATION.md
- 💬 **Discussions**: [GitHub Discussions](https://github.com/pin705/headless-sentry/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/pin705/headless-sentry/issues)
- 📧 **Email**: support@headless-sentry.com

---

## ⭐ Show Your Support

If you find these new features helpful, please:
- ⭐ Star the repository
- 🔄 Share with others
- 💬 Give us feedback
- 🤝 Contribute improvements

---

**Version:** 2.0.0  
**Release Date:** October 31, 2025  
**Changelog:** See full changelog in pull request  

Thank you for using Headless Sentry! 🚀

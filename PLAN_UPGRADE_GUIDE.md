# Plan Upgrade and Payment System Guide

## Overview

This guide explains how to use the plan upgrade system with multiple payment methods and plan-based limit enforcement.

## Features

### 1. Plan Limits

The system supports two plan types with different limits:

#### FREE Plan
- 1 Project
- 5 Monitors
- 1 Member (owner only)
- Check frequency: 5 minutes minimum
- Data retention: 1 day
- Features: Basic monitoring, SSL checks, Status page

#### PRO Plan (200,000 VND/month)
- 10 Projects
- 50 Monitors
- 10 Members per project
- Check frequency: 1 minute minimum
- Data retention: 30 days
- Features: All FREE features + Heartbeat monitoring, Custom domain, Advanced alerts

### 2. Payment Methods

The system supports three payment methods:

#### 1. Account Balance
- Direct payment using your account balance
- Instant upgrade upon payment
- Balance can be topped up via bank transfer (Sepay)

#### 2. Lemon Squeezy (International)
- Credit/debit card payments
- Automatic subscription management
- Webhook integration for automatic upgrades

#### 3. Sepay (Vietnam)
- Bank transfer via Vietnamese banks
- Automatic verification and account upgrade
- Typically processes within 1-2 minutes

## API Endpoints

### Get Current Usage and Limits

```http
GET /api/user/plan/usage
```

Returns:
```json
{
  "plan": "free",
  "planExpiresAt": null,
  "balance": 0,
  "limits": {
    "maxProjects": 1,
    "maxMonitors": 5,
    "maxMembers": 1,
    "checkInterval": 5,
    "dataRetention": 1,
    "hasSSLMonitoring": true,
    "hasStatusPage": true,
    "hasHeartbeat": false,
    "hasCustomDomain": false,
    "hasAdvancedAlerts": false
  },
  "usage": {
    "projects": { "current": 0, "limit": 1 },
    "monitors": { "current": 0, "limit": 5 },
    "members": { "current": 0, "limit": 1 }
  }
}
```

### Upgrade Plan

```http
POST /api/user/plan/upgrade
Content-Type: application/json

{
  "targetPlan": "pro",
  "paymentMethod": "balance|lemon_squeezy|sepay",
  "useBalance": true,  // Required for balance payment
  "returnUrl": "https://yourdomain.com/pricing"  // Optional for Lemon Squeezy
}
```

#### Response for Balance Payment:
```json
{
  "success": true,
  "message": "Nâng cấp thành công",
  "plan": "pro",
  "planExpiresAt": "2025-11-30T09:40:25.880Z",
  "balance": 0
}
```

#### Response for Bank Transfer (Sepay):
```json
{
  "success": true,
  "paymentMethod": "sepay",
  "message": "Vui lòng chuyển khoản theo thông tin dưới đây",
  "price": 200000,
  "bankInfo": {
    "bankName": "MB Bank",
    "accountNumber": "0123456789",
    "accountName": "HEADLESS SENTRY",
    "amount": 200000,
    "transferContent": "NANGCAP user@example.com"
  },
  "instructions": "..."
}
```

## Webhook Integration

### Lemon Squeezy Webhook

Configure webhook URL: `https://yourdomain.com/api/webhooks/lemon-squeezy`

Supported events:
- `order_created` / `subscription_created` - Upgrades user to PRO
- `subscription_updated` - Extends plan expiration
- `subscription_cancelled` / `subscription_expired` - Downgrades to FREE

### Sepay Webhook

Configure webhook URL: `https://yourdomain.com/api/webhooks/sepay`

**Note**: Currently requires admin authentication. Configure `ADMIN_EMAIL` in environment variables.

## Environment Variables

Add these to your `.env` file:

```bash
# Payment Gateway - Lemon Squeezy
LEMON_SQUEEZY_API_KEY=your_api_key
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_VARIANT_ID=your_variant_id
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret

# Payment Gateway - Sepay
SEPAY_API_KEY=your_api_key
SEPAY_ACCOUNT_NUMBER=your_account_number

# Admin
ADMIN_EMAIL=admin@yourdomain.com
```

## Plan Limit Enforcement

The system automatically enforces plan limits when:

### Creating Projects
```typescript
// Automatically checks if user has reached project limit
POST /api/projects
```

Error response if limit reached:
```json
{
  "statusCode": 403,
  "message": "Bạn đã đạt giới hạn 1 dự án của gói FREE. Vui lòng nâng cấp để tạo thêm dự án."
}
```

### Creating Monitors
```typescript
// Checks monitor limit and frequency restrictions
POST /api/projects/:projectId/monitors
```

The system validates:
1. Total monitor count across all projects
2. Monitor check frequency based on plan

### Inviting Members
```typescript
// Checks member limit based on project owner's plan
POST /api/projects/:projectId/members/invite
```

## Transaction Tracking

All payments and plan changes are tracked in the `transactions` collection:

```typescript
{
  userId: ObjectId,
  amount: 200000,
  type: 'plan_upgrade' | 'plan_renewal' | 'deposit' | 'refund',
  method: 'lemon_squeezy' | 'sepay' | 'manual',
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  previousBalance: 0,
  newBalance: 0,
  planBefore: 'free',
  planAfter: 'pro',
  externalId: 'payment_gateway_id',
  note: 'Nâng cấp lên gói PRO...',
  createdAt: Date,
  updatedAt: Date
}
```

## Usage in Code

### Check if feature is available

```typescript
import { hasFeature, getPlanLimits } from '~~/shared/constants/plans'

const user = await User.findById(userId)
const limits = getPlanLimits(user.plan)

if (limits.hasHeartbeat) {
  // Allow heartbeat monitoring
}
```

### Check limits before action

```typescript
import { canCreateProject, canCreateMonitor } from '~/server/utils/plan-limits'

// Check if user can create a project
const check = await canCreateProject(userId)
if (!check.allowed) {
  throw createError({ statusCode: 403, message: check.reason })
}
```

## Frontend Integration

The pricing page at `/pricing` provides a UI for:
1. Viewing current plan and limits
2. Comparing plan features
3. Selecting payment method
4. Processing upgrades
5. Viewing payment instructions (for bank transfer)

## Testing

### Test Plan Upgrade with Balance

1. As admin, add balance to test user:
```http
POST /api/webhooks/sepay
{
  "amount": 200000,
  "userEmail": "test@example.com",
  "method": "sepay",
  "note": "Test deposit"
}
```

2. Upgrade using balance:
```http
POST /api/user/plan/upgrade
{
  "targetPlan": "pro",
  "paymentMethod": "balance",
  "useBalance": true
}
```

### Test Limit Enforcement

1. Create projects until limit is reached
2. Try to create one more - should get 403 error
3. Upgrade plan
4. Now able to create more projects

## Notes

- Plan expiration is set to 30 days from upgrade date
- Expired plans automatically downgrade to FREE (implement cron job)
- Balance is stored in VND (Vietnamese Dong)
- Lemon Squeezy amounts are converted at ~25,000 VND per USD
- All transactions are logged for audit purposes

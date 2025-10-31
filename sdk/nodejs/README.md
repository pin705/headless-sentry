# Headless Sentry Node.js SDK

A lightweight client library for integrating Headless Sentry monitoring and logging into your Node.js applications.

## Installation

Currently, this is a standalone file. Copy `headless-sentry-client.js` to your project:

```bash
cp headless-sentry-client.js /path/to/your/project/
```

Or install via npm (when published):
```bash
npm install @headless-sentry/client
```

## Quick Start

```javascript
const HeadlessSentry = require('./headless-sentry-client')

const sentry = new HeadlessSentry({
  url: 'https://your-instance.com',
  apiKey: 'your-api-key',
  projectId: 'your-project-id' // Required for deployments
})

// Send logs
await sentry.log.info('Application started', { version: '1.0.0' })
await sentry.log.error('Database error', { error: err.message })

// Record deployments
await sentry.deployment.record('v1.2.3', 'Feature release')

// Send heartbeat
await sentry.heartbeat.send('monitor-id')
```

## Configuration

### Constructor Options

```javascript
const sentry = new HeadlessSentry({
  url: string,           // Required: Your Headless Sentry instance URL
  apiKey: string,        // Required: API key with appropriate permissions
  projectId: string,     // Optional: Required for deployment recording
  batchSize: number,     // Optional: Batch size for queued logs (default: 10)
  batchInterval: number  // Optional: Batch flush interval in ms (default: 5000)
})
```

### Environment Variables

Alternatively, set environment variables:

```bash
export HEADLESS_SENTRY_URL="https://your-instance.com"
export HEADLESS_SENTRY_API_KEY="your-api-key"
export HEADLESS_SENTRY_PROJECT_ID="your-project-id"
```

Then initialize without options:
```javascript
const sentry = new HeadlessSentry()
```

## API Reference

### Logging

#### Send Immediate Logs

```javascript
// Send a log immediately
await sentry.log.send(level, message, metadata, options)

// Convenience methods
await sentry.log.debug('Debug message', { data: 'value' })
await sentry.log.info('Info message', { userId: '123' })
await sentry.log.warn('Warning message', { threshold: 80 })
await sentry.log.error('Error message', { error: err.message })
await sentry.log.fatal('Fatal error', { error: err.stack })
```

**Parameters:**
- `level`: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
- `message`: string - The log message
- `metadata`: object - Additional structured data
- `options`: object (optional)
  - `timestamp`: ISO datetime string
  - `source`: string - Log source ('application', 'system', 'agent')
  - `tags`: string[] - Array of tags
  - `monitorId`: string - Associated monitor ID

#### Batch Logging (Recommended for High Volume)

```javascript
// Queue logs for batch sending
sentry.log.queueInfo('User action', { action: 'login' })
sentry.log.queueInfo('Page view', { page: '/home' })
sentry.log.queueError('API error', { endpoint: '/api/users' })

// Logs are automatically sent when:
// 1. Batch size is reached (default: 10 logs)
// 2. Batch interval expires (default: 5 seconds)

// Manual flush
await sentry.flush()
```

**Batch Methods:**
```javascript
sentry.log.queueDebug(message, metadata, options)
sentry.log.queueInfo(message, metadata, options)
sentry.log.queueWarn(message, metadata, options)
sentry.log.queueError(message, metadata, options)
sentry.log.queueFatal(message, metadata, options)
```

#### Send Batch Manually

```javascript
const logs = [
  { level: 'INFO', message: 'Log 1', metadata: {} },
  { level: 'ERROR', message: 'Log 2', metadata: { error: 'details' } }
]

await sentry.log.sendBatch(logs)
```

### Deployments

```javascript
// Record a deployment
await sentry.deployment.record(version, description, options)

// Examples
await sentry.deployment.record('v1.2.3', 'Feature release')

await sentry.deployment.record('v1.2.4', 'Bug fixes', {
  environment: 'staging',
  deployedBy: 'CI/CD',
  status: 'success',
  metadata: {
    commitHash: 'abc123',
    branch: 'main'
  }
})
```

**Parameters:**
- `version`: string (required) - Version number
- `description`: string (optional) - Deployment description
- `options`: object (optional)
  - `environment`: 'production' | 'staging' | 'development'
  - `deployedBy`: string - Who/what deployed
  - `status`: 'success' | 'failed' | 'rollback'
  - `metadata`: object - Additional data

### Heartbeat

```javascript
// Send single heartbeat
await sentry.heartbeat.send('monitor-id')

// Start periodic heartbeat
const heartbeat = sentry.heartbeat.start('monitor-id', 60000) // every 60 seconds

// Stop heartbeat
heartbeat.stop()
```

### Cleanup

```javascript
// Flush pending logs and close
await sentry.close()

// Or just flush
await sentry.flush()
```

## Usage Patterns

### Express.js Integration

```javascript
const express = require('express')
const HeadlessSentry = require('./headless-sentry-client')

const app = express()
const sentry = new HeadlessSentry({
  url: process.env.HEADLESS_SENTRY_URL,
  apiKey: process.env.HEADLESS_SENTRY_API_KEY
})

// Log all requests
app.use((req, res, next) => {
  sentry.log.queueInfo('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip
  })
  next()
})

// Error handling
app.use((err, req, res, next) => {
  sentry.log.error('Application Error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  })
  res.status(500).send('Internal Server Error')
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await sentry.close()
  process.exit(0)
})

app.listen(3000)
```

### Database Connection Monitoring

```javascript
const mongoose = require('mongoose')
const sentry = new HeadlessSentry(...)

mongoose.connection.on('connected', () => {
  sentry.log.info('MongoDB connected', { host: 'db.example.com' })
})

mongoose.connection.on('error', (err) => {
  sentry.log.error('MongoDB error', { 
    error: err.message,
    host: 'db.example.com'
  })
})

mongoose.connection.on('disconnected', () => {
  sentry.log.warn('MongoDB disconnected')
})
```

### Deployment Integration

```javascript
// In your deployment script or CI/CD pipeline
const sentry = new HeadlessSentry({
  url: process.env.HEADLESS_SENTRY_URL,
  apiKey: process.env.HEADLESS_SENTRY_API_KEY,
  projectId: process.env.HEADLESS_SENTRY_PROJECT_ID
})

async function deploy() {
  try {
    // Your deployment logic
    await deployApplication()
    
    // Record successful deployment
    await sentry.deployment.record(
      process.env.VERSION,
      process.env.COMMIT_MESSAGE,
      {
        environment: 'production',
        deployedBy: 'GitHub Actions',
        status: 'success',
        metadata: {
          commitHash: process.env.COMMIT_SHA,
          branch: process.env.BRANCH
        }
      }
    )
    
    console.log('Deployment recorded')
  } catch (error) {
    // Record failed deployment
    await sentry.deployment.record(
      process.env.VERSION,
      'Deployment failed',
      {
        environment: 'production',
        deployedBy: 'GitHub Actions',
        status: 'failed',
        metadata: {
          error: error.message
        }
      }
    )
    
    throw error
  }
}

deploy()
```

### Worker Process with Heartbeat

```javascript
const sentry = new HeadlessSentry(...)

// Start heartbeat
const heartbeat = sentry.heartbeat.start('worker-monitor-id', 30000)

// Your worker logic
setInterval(() => {
  processJobs()
    .then(() => {
      sentry.log.queueInfo('Jobs processed')
    })
    .catch(err => {
      sentry.log.error('Job processing failed', { error: err.message })
    })
}, 60000)

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  heartbeat.stop()
  await sentry.close()
  process.exit(0)
})
```

### Custom Logger Wrapper

```javascript
class Logger {
  constructor() {
    this.sentry = new HeadlessSentry(...)
  }
  
  debug(message, context = {}) {
    console.log('[DEBUG]', message, context)
    this.sentry.log.queueDebug(message, context)
  }
  
  info(message, context = {}) {
    console.log('[INFO]', message, context)
    this.sentry.log.queueInfo(message, context)
  }
  
  warn(message, context = {}) {
    console.warn('[WARN]', message, context)
    this.sentry.log.queueWarn(message, context)
  }
  
  error(message, context = {}) {
    console.error('[ERROR]', message, context)
    this.sentry.log.error(message, context) // Send immediately for errors
  }
  
  async close() {
    await this.sentry.close()
  }
}

// Usage
const logger = new Logger()
logger.info('Application started')
logger.error('Database connection failed', { error: err.message })
```

## Best Practices

1. **Use Batch Logging for High Volume:**
   - Use `queueInfo()`, `queueError()` etc. for high-frequency logs
   - Only use direct `info()`, `error()` for critical logs that need immediate sending

2. **Structure Your Metadata:**
   - Use consistent key names across logs
   - Include relevant context (user ID, request ID, etc.)
   - Don't log sensitive information (passwords, tokens, etc.)

3. **Graceful Shutdown:**
   - Always call `sentry.close()` before process exit
   - This ensures pending logs are flushed

4. **Error Handling:**
   - Wrap SDK calls in try-catch if needed
   - The SDK logs its own errors to console but doesn't throw

5. **Environment Configuration:**
   - Use different API keys for different environments
   - Adjust batch settings based on log volume

6. **Tag Usage:**
   - Use tags for categorization (e.g., ['payment', 'critical'])
   - Makes filtering in UI easier

## Troubleshooting

**Logs not appearing:**
- Check API key has `log:write` permission
- Verify URL is correct and accessible
- Check network connectivity
- Enable debug mode (see below)

**Deployments not recording:**
- Ensure `projectId` is set
- Check API key has `deployment:write` permission
- Verify project ID is correct

**High memory usage:**
- Reduce `batchSize` or `batchInterval`
- Flush more frequently
- Don't log excessively large metadata objects

**Debug Mode:**
```javascript
// Enable debug logging
const sentry = new HeadlessSentry({ url, apiKey })
sentry._request = new Proxy(sentry._request, {
  apply: async (target, thisArg, args) => {
    console.log('API Request:', args[0], args[1])
    return await target.apply(thisArg, args)
  }
})
```

## License

MIT

## Support

- GitHub: https://github.com/pin705/headless-sentry
- Issues: https://github.com/pin705/headless-sentry/issues
- Documentation: /FEATURE_IMPLEMENTATION.md

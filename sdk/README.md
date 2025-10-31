# Headless Sentry SDKs

This directory contains official client SDKs for integrating Headless Sentry into your applications.

## Available SDKs

### Node.js SDK
**Location:** `nodejs/`  
**Status:** ✅ Production Ready  
**Documentation:** [nodejs/README.md](./nodejs/README.md)

**Features:**
- Log ingestion (single & batch)
- Deployment recording
- Heartbeat management
- Auto-retry and buffering
- TypeScript support (coming soon)

**Quick Start:**
```javascript
const HeadlessSentry = require('./nodejs/headless-sentry-client')

const sentry = new HeadlessSentry({
  url: 'https://your-instance.com',
  apiKey: 'your-api-key'
})

await sentry.log.error('Something went wrong', { error: err.message })
```

---

## Coming Soon

### Python SDK
**Status:** 🚧 Planned

**Planned Features:**
- Log ingestion with asyncio support
- Server monitoring helper
- Django/Flask middleware
- Decorators for function monitoring

### Go SDK
**Status:** 🚧 Planned

**Planned Features:**
- Goroutine-safe logging
- Context-aware logging
- Structured logging support
- HTTP middleware

### PHP SDK
**Status:** 🚧 Planned

**Planned Features:**
- Laravel integration
- Symfony bundle
- PSR-3 logger implementation
- Composer package

---

## General SDK Features

All SDKs will support:

1. **Logging**
   - Multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL)
   - Structured metadata
   - Batch sending for high volume
   - Async/sync modes

2. **Deployment Tracking**
   - Record deployments from CI/CD
   - Environment support
   - Metadata for commit info

3. **Heartbeat**
   - Send heartbeat signals
   - Periodic heartbeat mode
   - Automatic reconnection

4. **Configuration**
   - Environment variables
   - Programmatic configuration
   - Sensible defaults
   - Custom HTTP clients

5. **Error Handling**
   - Graceful degradation
   - Automatic retries
   - Circuit breaker pattern
   - Offline buffering

---

## Integration Examples

### Express.js (Node.js)
```javascript
const express = require('express')
const HeadlessSentry = require('./nodejs/headless-sentry-client')

const app = express()
const sentry = new HeadlessSentry({ url, apiKey })

// Log all requests
app.use((req, res, next) => {
  sentry.log.queueInfo('HTTP Request', {
    method: req.method,
    url: req.url
  })
  next()
})

// Error handling
app.use((err, req, res, next) => {
  sentry.log.error('Application Error', {
    error: err.message,
    stack: err.stack
  })
  res.status(500).send('Error')
})
```

### Docker Compose
```yaml
version: '3'
services:
  app:
    build: .
    environment:
      - HEADLESS_SENTRY_URL=https://your-instance.com
      - HEADLESS_SENTRY_API_KEY=${SENTRY_API_KEY}
      - HEADLESS_SENTRY_PROJECT_ID=${SENTRY_PROJECT_ID}
```

### GitHub Actions
```yaml
- name: Record Deployment
  env:
    HEADLESS_SENTRY_URL: ${{ secrets.SENTRY_URL }}
    HEADLESS_SENTRY_API_KEY: ${{ secrets.SENTRY_API_KEY }}
    HEADLESS_SENTRY_PROJECT_ID: ${{ secrets.SENTRY_PROJECT_ID }}
  run: |
    node -e "
      const HeadlessSentry = require('./sdk/nodejs/headless-sentry-client');
      const sentry = new HeadlessSentry();
      sentry.deployment.record(
        '${{ github.ref_name }}',
        '${{ github.event.head_commit.message }}'
      ).then(() => console.log('Deployment recorded'));
    "
```

---

## API Endpoints Used by SDKs

All SDKs interact with these endpoints:

### Log Ingestion
```
POST /api/log/ingest
Headers:
  X-API-Key: your-api-key
  Content-Type: application/json
Body: { level, message, metadata, ... }
```

### Deployment Recording
```
POST /api/projects/[projectId]/deployments
Headers:
  X-API-Key: your-api-key
  Content-Type: application/json
Body: { version, description, environment, ... }
```

### Heartbeat
```
GET /api/public/heartbeat/[monitorId]
Headers:
  X-API-Key: your-api-key
```

### Server Metrics
```
POST /api/monitor/server-metrics
Headers:
  X-API-Key: your-api-key
  Content-Type: application/json
Body: { monitorId, cpuUsage, memoryUsage, ... }
```

---

## SDK Development Guidelines

If you're developing a new SDK or contributing:

### Required Features
- [x] Log ingestion (single & batch)
- [x] Deployment recording
- [x] Heartbeat sending
- [x] Environment variable config
- [x] Error handling & retries
- [x] Documentation & examples

### Recommended Features
- [ ] Async/sync modes
- [ ] Offline buffering
- [ ] Automatic batching
- [ ] Custom HTTP clients
- [ ] Framework integrations
- [ ] TypeScript definitions

### Code Quality
- Follow language-specific conventions
- Include unit tests
- Add integration tests
- Document all public APIs
- Provide usage examples

### Security
- Never log sensitive data by default
- Validate API keys
- Use HTTPS by default
- Implement request signing (future)

---

## Getting API Keys

1. **Create API Key:**
   - Navigate to your project in Headless Sentry
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Select required permissions:
     - `log:write` - For logging
     - `deployment:write` - For deployments
     - `heartbeat:write` - For heartbeats
     - `monitor:write` - For server metrics

2. **Secure Storage:**
   - Store in environment variables
   - Use secret management systems
   - Never commit to source control
   - Rotate periodically

3. **Testing:**
   ```bash
   curl -X POST https://your-instance.com/api/log/ingest \
     -H "X-API-Key: your-test-key" \
     -d '{"level":"INFO","message":"Test log"}'
   ```

---

## Support & Contribution

### Report Issues
- SDK-specific issues: Create issue in main repo
- Feature requests: GitHub Discussions
- Security issues: Email maintainers

### Contribute
1. Fork the repository
2. Create feature branch
3. Add tests
4. Update documentation
5. Submit pull request

### Community SDKs
If you've created an SDK for another language:
1. Follow the guidelines above
2. Add documentation
3. Submit PR to add to this README
4. We'll feature it here!

---

## Resources

- **Main Documentation:** [/FEATURE_IMPLEMENTATION.md](../FEATURE_IMPLEMENTATION.md)
- **API Reference:** See Feature Implementation doc
- **Server Agent:** [/agents/README.md](../agents/README.md)
- **GitHub:** https://github.com/pin705/headless-sentry

---

## License

All SDKs are released under the MIT License.

---

**Last Updated:** 2024-01-31  
**Available SDKs:** 1 (Node.js)  
**Planned SDKs:** 3 (Python, Go, PHP)

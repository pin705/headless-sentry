# Feature Implementation Guide

This document provides a comprehensive guide to the new features implemented in Headless Sentry, covering Stages 1-3 of the enhancement plan.

## Table of Contents

1. [Stage 1: Data Experience & Performance Enhancement](#stage-1-data-experience--performance-enhancement)
2. [Stage 2: Remote Monitoring & Log Analysis](#stage-2-remote-monitoring--log-analysis)
3. [Stage 3: CI/CD & DevTools Integration](#stage-3-cicd--devtools-integration)
4. [Stage 4: Scalability & Maintenance](#stage-4-scalability--maintenance)

---

## Stage 1: Data Experience & Performance Enhancement

### Chart Performance Optimization

#### New API Endpoint: Performance with Aggregation

**Endpoint:** `/api/projects/[projectId]/monitors/[monitorId]/performance-aggregated`

**Features:**
- Automatic aggregation level selection based on time range
- Support for minute, hour, and day aggregation
- MongoDB aggregation pipeline for efficient data processing
- Reduced data points for better frontend performance

**Query Parameters:**
- `hours` (number, default: 24): Time range in hours (1-720)
- `aggregation` (string, optional): Force aggregation level ('minute', 'hour', 'day')

**Example Request:**
```bash
GET /api/projects/123/monitors/456/performance-aggregated?hours=168&aggregation=hour
```

**Example Response:**
```json
{
  "period": {
    "hours": 168,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-08T00:00:00Z",
    "aggregation": "hour"
  },
  "stats": {
    "avgLatency": 245,
    "minLatency": 120,
    "maxLatency": 890,
    "totalChecks": 1680,
    "successfulChecks": 1650,
    "uptimePercent": 98.21
  },
  "chartData": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "avgLatency": 240,
      "minLatency": 200,
      "maxLatency": 300,
      "count": 10,
      "upCount": 10,
      "downCount": 0,
      "uptimePercent": 100,
      "isUp": true
    }
  ],
  "dataPoints": 168
}
```

**Performance Benefits:**
- For 30 days of data: Reduced from ~43,200 points (1/min) to 720 points (hourly)
- Automatic sampling: Minute-level for <6h, hourly for <72h, daily for longer periods
- MongoDB aggregation pipeline processes data on the server

### Customizable Dashboard (Backend Ready)

**Models Created:**
- `Dashboard` model with support for layouts and widgets

**API Endpoints:**
```
POST   /api/projects/[projectId]/dashboards      # Create dashboard
GET    /api/projects/[projectId]/dashboards      # List dashboards
GET    /api/projects/[projectId]/dashboards/:id  # Get dashboard
PUT    /api/projects/[projectId]/dashboards/:id  # Update dashboard
DELETE /api/projects/[projectId]/dashboards/:id  # Delete dashboard
```

**Dashboard Model:**
```typescript
{
  userId: ObjectId,
  projectId: ObjectId,
  name: string,
  isDefault: boolean,
  layoutConfig: [
    { i: string, x: number, y: number, w: number, h: number }
  ],
  widgetConfigs: [
    {
      id: string,
      type: 'uptime' | 'latency' | 'errorRate' | 'sslStatus' | 'recentChecks',
      monitorId: ObjectId,
      title: string,
      config: object
    }
  ]
}
```

**Next Steps:**
- [ ] Build dashboard management UI
- [ ] Integrate Vue Grid Layout or similar drag-and-drop library
- [ ] Create widget components for each type

---

## Stage 2: Remote Monitoring & Log Analysis

### Server Monitoring

#### Server Monitoring Agent

**Location:** `/agents/server-monitor-agent.js`

**Features:**
- Lightweight Node.js script
- Collects CPU, Memory, Disk, Load Average metrics
- Configurable via environment variables
- Can run as systemd service, PM2 process, or Docker container

**Installation:**

1. **Copy agent to your server:**
```bash
scp agents/server-monitor-agent.js user@your-server:/opt/headless-sentry/
```

2. **Set environment variables:**
```bash
export HEADLESS_SENTRY_URL="https://your-instance.com"
export HEADLESS_SENTRY_API_KEY="your-api-key"
export HEADLESS_SENTRY_MONITOR_ID="your-monitor-id"
export REPORT_INTERVAL="60"  # seconds
```

3. **Run the agent:**
```bash
node /opt/headless-sentry/server-monitor-agent.js
```

**As Systemd Service:**
```ini
[Unit]
Description=Headless Sentry Server Monitor Agent
After=network.target

[Service]
Type=simple
User=root
Environment="HEADLESS_SENTRY_URL=https://your-instance.com"
Environment="HEADLESS_SENTRY_API_KEY=your-api-key"
Environment="HEADLESS_SENTRY_MONITOR_ID=your-monitor-id"
ExecStart=/usr/bin/node /opt/headless-sentry/server-monitor-agent.js
Restart=always

[Install]
WantedBy=multi-user.target
```

#### Monitor Model Updates

Added `serverConfig` field:
```typescript
{
  serverConfig: {
    agentVersion: string,
    hostname: string,
    cpuThreshold: number,     // Default: 80%
    memoryThreshold: number,  // Default: 80%
    diskThreshold: number     // Default: 90%
  }
}
```

#### Result Model Updates

Added `serverMetrics` field:
```typescript
{
  serverMetrics: {
    cpuUsage: number,
    memoryUsage: number,
    memoryUsedMB: number,
    memoryTotalMB: number,
    diskUsage: number,
    diskUsedGB: number,
    diskTotalGB: number,
    networkIn: number,
    networkOut: number,
    loadAverage: [number, number, number]
  }
}
```

#### API Endpoint

**Endpoint:** `POST /api/monitor/server-metrics`

**Authentication:** API Key (X-API-Key header)

**Request Body:**
```json
{
  "monitorId": "monitor-id",
  "cpuUsage": 45.2,
  "memoryUsage": 62.5,
  "memoryUsedMB": 5120,
  "memoryTotalMB": 8192,
  "diskUsage": 75.3,
  "diskUsedGB": 150.6,
  "diskTotalGB": 200,
  "networkIn": 1024000,
  "networkOut": 512000,
  "loadAverage": [1.2, 1.5, 1.8],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Server metrics recorded successfully",
  "data": {
    "isUp": true,
    "thresholds": {
      "cpu": 80,
      "memory": 80,
      "disk": 90
    }
  }
}
```

### Log Aggregation

#### Log Model

```typescript
{
  projectId: ObjectId,
  timestamp: Date,
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL',
  message: string,
  metadata: object,
  monitorId: ObjectId (optional),
  source: string,  // 'application', 'system', 'agent'
  tags: [string]
}
```

**Indexes:**
- `projectId + timestamp` (descending)
- `projectId + level + timestamp`

**TTL:** 90 days (configurable)

#### Log Ingestion API

**Endpoint:** `POST /api/log/ingest`

**Authentication:** API Key (X-API-Key header or Bearer token)

**Single Log Request:**
```json
{
  "level": "ERROR",
  "message": "Database connection failed",
  "timestamp": "2024-01-01T12:00:00Z",
  "metadata": {
    "error": "Connection timeout",
    "host": "db.example.com",
    "port": 5432
  },
  "source": "application",
  "tags": ["database", "critical"]
}
```

**Batch Logs Request:**
```json
{
  "logs": [
    {
      "level": "INFO",
      "message": "User logged in",
      "metadata": { "userId": "123" }
    },
    {
      "level": "WARN",
      "message": "Slow query detected",
      "metadata": { "query": "SELECT * FROM users", "duration": 5000 }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "5 log(s) ingested successfully"
}
```

**Error Threshold Alert:**
- Automatically checks if ERROR logs exceed 10 in 5 minutes
- Can be configured per project
- Triggers alerts to project members

#### Logs Viewing API

**Endpoint:** `GET /api/projects/[projectId]/logs`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, 1-100, default: 50)
- `level` (string, optional): Filter by log level
- `search` (string, optional): Search in message
- `monitorId` (string, optional): Filter by monitor
- `source` (string, optional): Filter by source
- `startDate` (ISO datetime, optional)
- `endDate` (ISO datetime, optional)

**Example Request:**
```bash
GET /api/projects/123/logs?level=ERROR&search=database&page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1234,
      "totalPages": 25
    },
    "stats": {
      "DEBUG": 100,
      "INFO": 500,
      "WARN": 50,
      "ERROR": 30,
      "FATAL": 5
    }
  }
}
```

#### Logs UI

**Location:** `/app/pages/[projectId]/logs.vue`

**Features:**
- Real-time log viewing with pagination
- Multi-level filtering (level, source, search)
- Log statistics dashboard
- Detailed log view modal
- Metadata and tags display
- Bilingual support (English/Vietnamese)

**Access:** `https://your-instance.com/[projectId]/logs`

---

## Stage 3: CI/CD & DevTools Integration

### Deployment Monitoring

#### Deployment Model

```typescript
{
  projectId: ObjectId,
  timestamp: Date,
  version: string,
  description: string,
  environment: 'production' | 'staging' | 'development',
  deployedBy: string,
  status: 'success' | 'failed' | 'rollback',
  metadata: object
}
```

#### Record Deployment API

**Endpoint:** `POST /api/projects/[projectId]/deployments`

**Authentication:** API Key or Session

**Request Body:**
```json
{
  "version": "v1.2.3",
  "description": "Added new payment feature",
  "environment": "production",
  "deployedBy": "GitHub Actions",
  "status": "success",
  "metadata": {
    "commitHash": "abc123",
    "branch": "main",
    "buildNumber": "456"
  }
}
```

**CI/CD Integration Examples:**

**GitHub Actions:**
```yaml
- name: Record Deployment
  run: |
    curl -X POST https://your-instance.com/api/projects/123/deployments \
      -H "X-API-Key: ${{ secrets.HEADLESS_SENTRY_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{
        "version": "${{ github.ref_name }}",
        "description": "${{ github.event.head_commit.message }}",
        "environment": "production",
        "deployedBy": "GitHub Actions",
        "metadata": {
          "commitHash": "${{ github.sha }}",
          "branch": "${{ github.ref_name }}"
        }
      }'
```

**GitLab CI:**
```yaml
deploy:production:
  script:
    - curl -X POST https://your-instance.com/api/projects/123/deployments
      -H "X-API-Key: $HEADLESS_SENTRY_API_KEY"
      -H "Content-Type: application/json"
      -d "{\"version\":\"$CI_COMMIT_TAG\",\"environment\":\"production\"}"
```

#### View Deployments API

**Endpoint:** `GET /api/projects/[projectId]/deployments`

**Query Parameters:**
- `page`, `limit` (pagination)
- `environment` (filter)
- `status` (filter)
- `startDate`, `endDate` (date range)

**Next Steps:**
- [ ] Display deployment markers on charts
- [ ] Correlate deployments with performance changes
- [ ] Add deployment rollback functionality

### API Keys & SDKs

#### API Key Model

```typescript
{
  projectId: ObjectId,
  userId: ObjectId,
  name: string,
  keyHash: string,           // SHA-256 hash
  keyPrefix: string,         // First 8 chars for display
  permissions: [
    'log:write',
    'heartbeat:write',
    'deployment:write',
    'monitor:read',
    'monitor:write'
  ],
  lastUsedAt: Date,
  expiresAt: Date (optional),
  isActive: boolean
}
```

#### API Key Management

**Create API Key:**
```
POST /api/projects/[projectId]/api-keys
Body: { name, permissions, expiresAt? }
```

**List API Keys:**
```
GET /api/projects/[projectId]/api-keys
```

**Update API Key:**
```
PATCH /api/projects/[projectId]/api-keys/[keyId]
Body: { name?, isActive? }
```

**Delete API Key:**
```
DELETE /api/projects/[projectId]/api-keys/[keyId]
```

#### API Keys UI

**Location:** `/app/pages/[projectId]/api-keys.vue`

**Features:**
- Create API keys with specific permissions
- View all API keys (masked)
- Activate/deactivate keys
- Delete keys
- Copy key on creation (shown only once)
- Example usage snippets
- Security warnings
- Last used tracking
- Optional expiration dates

**Access:** `https://your-instance.com/[projectId]/api-keys`

#### SDK Examples

**Node.js - Log Ingestion:**
```javascript
const axios = require('axios')

async function sendLog(level, message, metadata = {}) {
  await axios.post('https://your-instance.com/api/log/ingest', {
    level,
    message,
    metadata,
    timestamp: new Date().toISOString()
  }, {
    headers: {
      'X-API-Key': process.env.HEADLESS_SENTRY_API_KEY,
      'Content-Type': 'application/json'
    }
  })
}

// Usage
sendLog('ERROR', 'Database connection failed', {
  error: err.message,
  host: 'db.example.com'
})
```

**Python - Batch Log Ingestion:**
```python
import requests
import os
from datetime import datetime

def send_logs(logs):
    response = requests.post(
        f"{os.getenv('HEADLESS_SENTRY_URL')}/api/log/ingest",
        json={'logs': logs},
        headers={
            'X-API-Key': os.getenv('HEADLESS_SENTRY_API_KEY'),
            'Content-Type': 'application/json'
        }
    )
    return response.json()

# Usage
logs = [
    {'level': 'INFO', 'message': 'App started'},
    {'level': 'ERROR', 'message': 'Failed to connect', 'metadata': {'error': str(e)}}
]
send_logs(logs)
```

**cURL - Record Deployment:**
```bash
curl -X POST https://your-instance.com/api/projects/123/deployments \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "v1.2.3",
    "description": "Feature release",
    "environment": "production",
    "status": "success"
  }'
```

---

## Stage 4: Scalability & Maintenance

### Multitenancy Considerations

All implemented APIs include proper multitenancy checks:

✅ **Implemented Security Measures:**
- All endpoints require authentication (session or API key)
- `projectId` validation on all project-scoped endpoints
- API keys are scoped to specific projects
- Users can only access their own projects
- Dashboard isolation by userId and projectId
- Logs, deployments, and API keys are isolated by projectId

✅ **Data Isolation:**
- MongoDB indexes on `projectId` for efficient queries
- API key permissions are project-specific
- Server metrics tied to specific monitor and project
- Logs automatically tagged with projectId

### Queue System (Planned)

**Benefits:**
- Asynchronous processing of heavy tasks
- Better fault tolerance
- Horizontal scaling capability

**Candidates for Queue Processing:**
1. Alert sending (webhook notifications)
2. Log ingestion (batch processing)
3. Server metrics processing
4. Email notifications
5. Report generation

**Implementation Plan:**
- [ ] Set up Redis or RabbitMQ
- [ ] Create queue workers
- [ ] Move alert logic to queue
- [ ] Move log ingestion to queue
- [ ] Add monitoring for queue health

---

## Usage Examples

### Complete Workflow Example

#### 1. Create a Server Monitor

```bash
# Via UI or API
POST /api/projects/123/monitors
{
  "name": "Production Server",
  "type": "server",
  "endpoint": "prod-server-01",
  "serverConfig": {
    "cpuThreshold": 80,
    "memoryThreshold": 80,
    "diskThreshold": 90
  }
}
```

#### 2. Generate API Key

```bash
# Via UI: /123/api-keys or API
POST /api/projects/123/api-keys
{
  "name": "Production Server Agent",
  "permissions": ["monitor:write", "log:write"]
}
# Response: { key: "hs_12345678_abc123..." }
```

#### 3. Deploy Monitoring Agent

```bash
# On your server
export HEADLESS_SENTRY_URL="https://sentry.example.com"
export HEADLESS_SENTRY_API_KEY="hs_12345678_abc123..."
export HEADLESS_SENTRY_MONITOR_ID="monitor-id-from-step-1"

node server-monitor-agent.js
```

#### 4. Integrate Log Ingestion

```javascript
// In your application
const logger = {
  error: (msg, meta) => sendLog('ERROR', msg, meta),
  warn: (msg, meta) => sendLog('WARN', msg, meta),
  info: (msg, meta) => sendLog('INFO', msg, meta)
}

// Usage
try {
  await database.connect()
  logger.info('Database connected')
} catch (error) {
  logger.error('Database connection failed', { 
    error: error.message 
  })
}
```

#### 5. Record Deployments

```bash
# In your CI/CD pipeline
curl -X POST https://sentry.example.com/api/projects/123/deployments \
  -H "X-API-Key: $API_KEY" \
  -d '{"version":"v1.2.3","environment":"production"}'
```

#### 6. Monitor Everything

- View server metrics on monitor detail page
- Check logs at `/123/logs`
- See deployments correlated with performance changes
- Receive alerts when thresholds are exceeded

---

## Security Best Practices

1. **API Key Management:**
   - Store API keys securely (environment variables, secret managers)
   - Never commit API keys to source control
   - Rotate keys periodically
   - Use separate keys for different environments
   - Grant minimum required permissions

2. **Network Security:**
   - Use HTTPS for all API communications
   - Whitelist IP addresses if possible
   - Consider using VPN for agent connections

3. **Access Control:**
   - Limit project access to necessary team members
   - Review API key usage regularly
   - Deactivate unused keys
   - Monitor `lastUsedAt` timestamps

4. **Data Privacy:**
   - Avoid logging sensitive information
   - Sanitize log metadata
   - Implement log retention policies
   - Comply with data protection regulations

---

## Troubleshooting

### Agent Not Sending Metrics

1. Check API key is valid and active
2. Verify monitor ID is correct
3. Ensure API key has `monitor:write` permission
4. Check network connectivity to Headless Sentry
5. Review agent logs for error messages

### Logs Not Appearing

1. Verify API key has `log:write` permission
2. Check log payload format matches API schema
3. Ensure `projectId` is correct
4. Review API response for error messages
5. Check database connection and indexes

### High Memory Usage

1. Reduce `REPORT_INTERVAL` for agents
2. Use batch log ingestion
3. Implement log sampling for high-volume applications
4. Consider log aggregation before sending

---

## Migration Guide

### Existing Projects

No breaking changes. New features are additive:

1. Existing monitors continue to work
2. New monitor type `'server'` is available
3. Existing performance API still works
4. New aggregated endpoint provides better performance

### Database Updates

Run these commands in MongoDB:

```javascript
// Create indexes for new collections
db.logs.createIndex({ projectId: 1, timestamp: -1 })
db.logs.createIndex({ projectId: 1, level: 1, timestamp: -1 })

db.deployments.createIndex({ projectId: 1, timestamp: -1 })

db.apikeys.createIndex({ projectId: 1, isActive: 1 })
db.apikeys.createIndex({ keyHash: 1, isActive: 1 })

db.dashboards.createIndex({ projectId: 1, userId: 1 })
```

---

## Performance Considerations

### Chart Loading
- Use aggregated endpoint for ranges > 6 hours
- Implement frontend caching for frequently viewed data
- Consider using Nitro cache for API responses

### Log Ingestion
- Use batch ingestion for high-volume applications
- Implement client-side buffering
- Consider sampling non-critical logs

### Server Monitoring
- Adjust `REPORT_INTERVAL` based on needs (default: 60s)
- Lower intervals increase accuracy but use more resources
- Higher intervals reduce load but decrease granularity

---

## Future Enhancements

### Planned Features

1. **Dashboard UI** (Stage 1)
   - Drag-and-drop widget builder
   - Multiple dashboard support
   - Widget library

2. **Python Agent** (Stage 2)
   - More accurate disk metrics
   - Better cross-platform support
   - Process-level monitoring

3. **Deployment Visualization** (Stage 3)
   - Deployment markers on charts
   - Performance correlation
   - Rollback detection

4. **Queue System** (Stage 4)
   - Redis/RabbitMQ integration
   - Worker processes
   - Improved reliability

5. **Advanced Analytics**
   - Log pattern detection
   - Anomaly detection
   - Predictive alerts

---

## Support & Contributing

For issues, questions, or contributions:
- GitHub Issues: https://github.com/pin705/headless-sentry/issues
- Documentation: https://github.com/pin705/headless-sentry/wiki
- Agent Documentation: `/agents/README.md`

---

**Last Updated:** 2024-01-31  
**Version:** 1.0.0  
**Status:** Stages 1-3 Complete, Stage 4 Planned

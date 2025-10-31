/**
 * Headless Sentry Client SDK for Node.js
 * 
 * A simple client library for integrating Headless Sentry into your Node.js application.
 * 
 * Usage:
 *   const HeadlessSentry = require('./headless-sentry-client')
 *   const sentry = new HeadlessSentry({
 *     url: 'https://your-instance.com',
 *     apiKey: 'your-api-key'
 *   })
 * 
 *   sentry.log.error('Something went wrong', { error: err.message })
 *   await sentry.deployment.record('v1.2.3', 'Feature release')
 */

const https = require('https')
const http = require('http')

class HeadlessSentryClient {
  constructor(options = {}) {
    this.url = options.url || process.env.HEADLESS_SENTRY_URL
    this.apiKey = options.apiKey || process.env.HEADLESS_SENTRY_API_KEY
    this.projectId = options.projectId || process.env.HEADLESS_SENTRY_PROJECT_ID
    this.batchSize = options.batchSize || 10
    this.batchInterval = options.batchInterval || 5000 // 5 seconds
    
    if (!this.url) {
      throw new Error('Headless Sentry URL is required')
    }
    
    if (!this.apiKey) {
      throw new Error('Headless Sentry API key is required')
    }
    
    this.logBuffer = []
    this.batchTimer = null
    
    // Initialize sub-modules
    this.log = this._createLogModule()
    this.deployment = this._createDeploymentModule()
    this.heartbeat = this._createHeartbeatModule()
  }
  
  /**
   * Make HTTP request to Headless Sentry API
   */
  async _request(endpoint, method = 'POST', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.url}${endpoint}`)
      const protocol = url.protocol === 'https:' ? https : http
      
      const data = body ? JSON.stringify(body) : null
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      }
      
      if (data) {
        options.headers['Content-Length'] = Buffer.byteLength(data)
      }
      
      const req = protocol.request(options, (res) => {
        let responseData = ''
        
        res.on('data', (chunk) => {
          responseData += chunk
        })
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData)
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed)
            } else {
              reject(new Error(parsed.message || `HTTP ${res.statusCode}`))
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${responseData}`))
          }
        })
      })
      
      req.on('error', (error) => {
        reject(error)
      })
      
      if (data) {
        req.write(data)
      }
      
      req.end()
    })
  }
  
  /**
   * Log module for sending logs
   */
  _createLogModule() {
    return {
      /**
       * Send a single log immediately
       */
      send: async (level, message, metadata = {}, options = {}) => {
        const log = {
          level: level.toUpperCase(),
          message,
          metadata,
          timestamp: options.timestamp || new Date().toISOString(),
          source: options.source || 'application',
          tags: options.tags || [],
          monitorId: options.monitorId
        }
        
        return await this._request('/api/log/ingest', 'POST', log)
      },
      
      /**
       * Send logs in batch
       */
      sendBatch: async (logs) => {
        if (!logs || logs.length === 0) return
        
        const formattedLogs = logs.map(log => ({
          level: log.level.toUpperCase(),
          message: log.message,
          metadata: log.metadata || {},
          timestamp: log.timestamp || new Date().toISOString(),
          source: log.source || 'application',
          tags: log.tags || []
        }))
        
        return await this._request('/api/log/ingest', 'POST', { logs: formattedLogs })
      },
      
      /**
       * Queue log for batch sending
       */
      queue: (level, message, metadata = {}, options = {}) => {
        this.logBuffer.push({
          level: level.toUpperCase(),
          message,
          metadata,
          timestamp: options.timestamp || new Date().toISOString(),
          source: options.source || 'application',
          tags: options.tags || []
        })
        
        if (this.logBuffer.length >= this.batchSize) {
          this._flushLogs()
        } else if (!this.batchTimer) {
          this.batchTimer = setTimeout(() => this._flushLogs(), this.batchInterval)
        }
      },
      
      /**
       * Convenience methods for different log levels
       */
      debug: (message, metadata, options) => 
        this.log.send('DEBUG', message, metadata, options),
      info: (message, metadata, options) => 
        this.log.send('INFO', message, metadata, options),
      warn: (message, metadata, options) => 
        this.log.send('WARN', message, metadata, options),
      error: (message, metadata, options) => 
        this.log.send('ERROR', message, metadata, options),
      fatal: (message, metadata, options) => 
        this.log.send('FATAL', message, metadata, options),
        
      /**
       * Queued versions (for high-volume logging)
       */
      queueDebug: (message, metadata, options) => 
        this.log.queue('DEBUG', message, metadata, options),
      queueInfo: (message, metadata, options) => 
        this.log.queue('INFO', message, metadata, options),
      queueWarn: (message, metadata, options) => 
        this.log.queue('WARN', message, metadata, options),
      queueError: (message, metadata, options) => 
        this.log.queue('ERROR', message, metadata, options),
      queueFatal: (message, metadata, options) => 
        this.log.queue('FATAL', message, metadata, options)
    }
  }
  
  /**
   * Flush queued logs
   */
  async _flushLogs() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    
    if (this.logBuffer.length === 0) return
    
    const logs = [...this.logBuffer]
    this.logBuffer = []
    
    try {
      await this.log.sendBatch(logs)
    } catch (error) {
      console.error('Failed to send log batch:', error.message)
      // Could implement retry logic here
    }
  }
  
  /**
   * Deployment module for recording deployments
   */
  _createDeploymentModule() {
    return {
      /**
       * Record a deployment
       */
      record: async (version, description = '', options = {}) => {
        if (!this.projectId) {
          throw new Error('Project ID is required for deployment recording')
        }
        
        const deployment = {
          version,
          description,
          environment: options.environment || 'production',
          deployedBy: options.deployedBy || 'SDK',
          status: options.status || 'success',
          metadata: options.metadata || {}
        }
        
        return await this._request(
          `/api/projects/${this.projectId}/deployments`,
          'POST',
          deployment
        )
      }
    }
  }
  
  /**
   * Heartbeat module for sending heartbeat signals
   */
  _createHeartbeatModule() {
    return {
      /**
       * Send a heartbeat
       */
      send: async (monitorId) => {
        if (!monitorId) {
          throw new Error('Monitor ID is required for heartbeat')
        }
        
        return await this._request(
          `/api/public/heartbeat/${monitorId}`,
          'GET'
        )
      },
      
      /**
       * Start periodic heartbeat
       */
      start: (monitorId, interval = 60000) => {
        const intervalId = setInterval(async () => {
          try {
            await this.heartbeat.send(monitorId)
          } catch (error) {
            console.error('Failed to send heartbeat:', error.message)
          }
        }, interval)
        
        return {
          stop: () => clearInterval(intervalId)
        }
      }
    }
  }
  
  /**
   * Flush any pending logs before shutdown
   */
  async flush() {
    await this._flushLogs()
  }
  
  /**
   * Clean up and close
   */
  async close() {
    await this.flush()
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
    }
  }
}

module.exports = HeadlessSentryClient

// Example usage
if (require.main === module) {
  const client = new HeadlessSentryClient({
    url: process.env.HEADLESS_SENTRY_URL || 'http://localhost:3000',
    apiKey: process.env.HEADLESS_SENTRY_API_KEY,
    projectId: process.env.HEADLESS_SENTRY_PROJECT_ID
  })
  
  // Example: Send logs
  client.log.info('Application started', { version: '1.0.0' })
    .then(() => console.log('Log sent'))
    .catch(err => console.error('Error:', err.message))
  
  // Example: Record deployment
  if (client.projectId) {
    client.deployment.record('v1.0.0', 'Initial release')
      .then(() => console.log('Deployment recorded'))
      .catch(err => console.error('Error:', err.message))
  }
  
  // Example: Queue logs for batch sending
  client.log.queueInfo('User logged in', { userId: '123' })
  client.log.queueInfo('Page viewed', { page: '/home' })
  
  // Flush and close
  setTimeout(async () => {
    await client.close()
    console.log('Client closed')
  }, 2000)
}

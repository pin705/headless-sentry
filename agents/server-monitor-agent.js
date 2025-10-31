#!/usr/bin/env node

/**
 * Headless Sentry - Server Monitoring Agent
 * 
 * This lightweight agent collects server metrics and sends them to your Headless Sentry instance.
 * 
 * Usage:
 *   node server-monitor-agent.js
 * 
 * Configuration via environment variables:
 *   HEADLESS_SENTRY_URL - Your Headless Sentry URL (default: http://localhost:3000)
 *   HEADLESS_SENTRY_API_KEY - Your API key with monitor:write permission
 *   HEADLESS_SENTRY_MONITOR_ID - The monitor ID for this server
 *   REPORT_INTERVAL - Interval in seconds to report metrics (default: 60)
 */

const os = require('os')
const https = require('https')
const http = require('http')

// Configuration
const config = {
  url: process.env.HEADLESS_SENTRY_URL || 'http://localhost:3000',
  apiKey: process.env.HEADLESS_SENTRY_API_KEY,
  monitorId: process.env.HEADLESS_SENTRY_MONITOR_ID,
  reportInterval: parseInt(process.env.REPORT_INTERVAL || '60') * 1000
}

// Validate configuration
if (!config.apiKey) {
  console.error('ERROR: HEADLESS_SENTRY_API_KEY environment variable is required')
  process.exit(1)
}

if (!config.monitorId) {
  console.error('ERROR: HEADLESS_SENTRY_MONITOR_ID environment variable is required')
  process.exit(1)
}

console.log('Headless Sentry Server Monitor Agent')
console.log('=====================================')
console.log(`URL: ${config.url}`)
console.log(`Monitor ID: ${config.monitorId}`)
console.log(`Report Interval: ${config.reportInterval / 1000}s`)
console.log('=====================================\n')

// Get CPU usage
function getCpuUsage() {
  const cpus = os.cpus()
  let totalIdle = 0
  let totalTick = 0

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type]
    }
    totalIdle += cpu.times.idle
  })

  const idle = totalIdle / cpus.length
  const total = totalTick / cpus.length
  const usage = 100 - Math.floor((idle / total) * 100)
  
  return Math.max(0, Math.min(100, usage))
}

// Get memory usage
function getMemoryUsage() {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  
  return {
    usage: Math.round((usedMem / totalMem) * 100 * 100) / 100,
    usedMB: Math.round(usedMem / 1024 / 1024),
    totalMB: Math.round(totalMem / 1024 / 1024)
  }
}

// Get disk usage (simple estimation - works on Linux)
function getDiskUsage() {
  // For a more accurate implementation, you would need to use native modules
  // or execute shell commands. This is a simplified version.
  
  // Fallback values if we can't determine actual disk usage
  return {
    usage: 0,
    usedGB: 0,
    totalGB: 0
  }
}

// Collect all metrics
function collectMetrics() {
  const cpuUsage = getCpuUsage()
  const memoryUsage = getMemoryUsage()
  const diskUsage = getDiskUsage()
  const loadAverage = os.loadavg()

  return {
    monitorId: config.monitorId,
    cpuUsage,
    memoryUsage: memoryUsage.usage,
    memoryUsedMB: memoryUsage.usedMB,
    memoryTotalMB: memoryUsage.totalMB,
    diskUsage: diskUsage.usage,
    diskUsedGB: diskUsage.usedGB,
    diskTotalGB: diskUsage.totalGB,
    loadAverage,
    timestamp: new Date().toISOString()
  }
}

// Send metrics to Headless Sentry
function sendMetrics(metrics) {
  const url = new URL(`${config.url}/api/monitor/server-metrics`)
  const protocol = url.protocol === 'https:' ? https : http

  const data = JSON.stringify(metrics)

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'X-API-Key': config.apiKey
    }
  }

  const req = protocol.request(options, (res) => {
    let responseData = ''

    res.on('data', (chunk) => {
      responseData += chunk
    })

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`[${new Date().toISOString()}] Metrics sent successfully`)
        console.log(`  CPU: ${metrics.cpuUsage}%, Memory: ${metrics.memoryUsage}%, Disk: ${metrics.diskUsage}%`)
      } else {
        console.error(`[${new Date().toISOString()}] Error sending metrics: ${res.statusCode}`)
        console.error(`  Response: ${responseData}`)
      }
    })
  })

  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Network error:`, error.message)
  })

  req.write(data)
  req.end()
}

// Main loop
function run() {
  try {
    const metrics = collectMetrics()
    sendMetrics(metrics)
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error collecting metrics:`, error.message)
  }
}

// Start the agent
console.log('Starting agent...\n')
run() // Send immediately on start
setInterval(run, config.reportInterval)

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down agent...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nShutting down agent...')
  process.exit(0)
})

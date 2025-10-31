# Headless Sentry Monitoring Agents

This directory contains lightweight monitoring agents that can be installed on your servers to send metrics to Headless Sentry.

## Server Monitoring Agent

The server monitoring agent collects system metrics (CPU, Memory, Disk, Network) and sends them to your Headless Sentry instance.

### Installation

1. **Create a Server Monitor** in Headless Sentry:
   - Go to your project
   - Create a new monitor with type "Server"
   - Note the Monitor ID

2. **Generate an API Key**:
   - Go to Project Settings > API Keys
   - Create a new API key with `monitor:write` permission
   - Save the API key securely

3. **Install the Agent** on your server:

```bash
# Copy the agent to your server
scp server-monitor-agent.js user@your-server:/opt/headless-sentry/

# Make it executable
chmod +x /opt/headless-sentry/server-monitor-agent.js
```

### Usage

#### Manual Execution

```bash
export HEADLESS_SENTRY_URL="https://your-sentry-instance.com"
export HEADLESS_SENTRY_API_KEY="your-api-key"
export HEADLESS_SENTRY_MONITOR_ID="your-monitor-id"
export REPORT_INTERVAL="60"  # Report every 60 seconds

node /opt/headless-sentry/server-monitor-agent.js
```

#### As a Systemd Service (Linux)

Create a systemd service file `/etc/systemd/system/headless-sentry-agent.service`:

```ini
[Unit]
Description=Headless Sentry Server Monitor Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/headless-sentry
Environment="HEADLESS_SENTRY_URL=https://your-sentry-instance.com"
Environment="HEADLESS_SENTRY_API_KEY=your-api-key"
Environment="HEADLESS_SENTRY_MONITOR_ID=your-monitor-id"
Environment="REPORT_INTERVAL=60"
ExecStart=/usr/bin/node /opt/headless-sentry/server-monitor-agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable headless-sentry-agent
sudo systemctl start headless-sentry-agent
sudo systemctl status headless-sentry-agent
```

View logs:

```bash
sudo journalctl -u headless-sentry-agent -f
```

#### Using PM2

```bash
pm2 start server-monitor-agent.js --name headless-sentry-agent \
  --env HEADLESS_SENTRY_URL=https://your-sentry-instance.com \
  --env HEADLESS_SENTRY_API_KEY=your-api-key \
  --env HEADLESS_SENTRY_MONITOR_ID=your-monitor-id \
  --env REPORT_INTERVAL=60

pm2 save
pm2 startup
```

### Configuration Options

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `HEADLESS_SENTRY_URL` | No | `http://localhost:3000` | Your Headless Sentry instance URL |
| `HEADLESS_SENTRY_API_KEY` | **Yes** | - | API key with `monitor:write` permission |
| `HEADLESS_SENTRY_MONITOR_ID` | **Yes** | - | The server monitor ID |
| `REPORT_INTERVAL` | No | `60` | Interval in seconds between metric reports |

### Metrics Collected

- **CPU Usage**: Percentage of CPU utilization
- **Memory Usage**: Percentage of RAM utilization
- **Memory Used/Total**: Used and total memory in MB
- **Disk Usage**: Percentage of disk space used
- **Disk Used/Total**: Used and total disk space in GB
- **Load Average**: System load average (1, 5, 15 minutes)
- **Network I/O**: Network input/output in bytes per second

### Alert Thresholds

You can configure alert thresholds in the Headless Sentry UI:

- **CPU Threshold**: Default 80%
- **Memory Threshold**: Default 80%
- **Disk Threshold**: Default 90%

When any metric exceeds its threshold, the monitor status will change to "Down" and alerts will be triggered.

### Troubleshooting

**Agent not sending metrics:**
1. Check that the API key is valid and has `monitor:write` permission
2. Verify the monitor ID is correct
3. Ensure the Headless Sentry URL is accessible from the server
4. Check firewall rules and network connectivity

**High resource usage:**
1. Increase the `REPORT_INTERVAL` to reduce frequency
2. Ensure only one instance of the agent is running

**Metrics not accurate:**
1. The agent provides basic metrics using Node.js `os` module
2. For more accurate disk usage, consider using native system tools
3. Network I/O metrics require platform-specific implementations

### Advanced Usage

#### Docker Container

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY server-monitor-agent.js .

ENV HEADLESS_SENTRY_URL=""
ENV HEADLESS_SENTRY_API_KEY=""
ENV HEADLESS_SENTRY_MONITOR_ID=""
ENV REPORT_INTERVAL="60"

CMD ["node", "server-monitor-agent.js"]
```

Build and run:

```bash
docker build -t headless-sentry-agent .
docker run -d \
  -e HEADLESS_SENTRY_URL="https://your-sentry-instance.com" \
  -e HEADLESS_SENTRY_API_KEY="your-api-key" \
  -e HEADLESS_SENTRY_MONITOR_ID="your-monitor-id" \
  --name sentry-agent \
  headless-sentry-agent
```

### Python Agent (Coming Soon)

A Python version of the agent is planned for future releases, which will provide:
- More accurate disk usage metrics
- Better cross-platform support
- Additional metrics (process monitoring, custom metrics)

### Contributing

Contributions to improve the agents are welcome! Please submit PRs with:
- Bug fixes
- Performance improvements
- Additional metrics
- Support for more platforms
- Documentation improvements

// action_repo/generate-email-html.js
const fs = require('fs');

const report = JSON.parse(fs.readFileSync('unified-report.json', 'utf8'));
const loadTest = report.load_test;
const prometheus = report.prometheus;
const status = report.test_status === 'true' ? '✅ PASS' : '❌ FAIL';

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🧪 Load Test Report - ${report.test_type.toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; background: #f8fafc; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(30,64,175,0.3); }
    .status-${status.includes('PASS') ? 'pass' : 'fail'} { color: ${status.includes('PASS') ? '#10b981' : '#ef4444'}; font-size: 1.5em; font-weight: bold; padding: 10px 20px; border-radius: 50px; display: inline-block; margin: 10px 0; }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6; }
    .metric-card.critical { border-left-color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f8fafc; font-weight: 600; color: #374151; }
    tr:hover { background: #f9fafb; }
    .warning { color: #f59e0b; }
    .critical { color: #ef4444; }
    h2 { color: #1e40af; margin: 25px 0 15px 0; font-size: 1.4em; }
    .timestamp { font-size: 0.9em; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Load Test Report</h1>
    <p><strong>${report.test_type.toUpperCase()}</strong> • ${report.repository}</p>
    <div class="status-${status.includes('PASS') ? 'pass' : 'fail'}">${status}</div>
  </div>

  <div class="metric-card">
    <h2>🌍 Test Environment</h2>
    <div class="metric-grid">
      <div><strong>Started:</strong> ${loadTest.root_group ? new Date(loadTest.root_group.latency?.min || 0).toISOString() : 'N/A'}</div>
      <div><strong>Ended:</strong> ${prometheus.timestamp}</div>
      <div><strong>Duration:</strong> ${prometheus.test_duration}</div>
      <div><strong>Repository:</strong> ${report.repository}</div>
    </div>
  </div>

  <div class="metric-card">
    <h2>🔵 Executive Summary</h2>
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Total Requests</td><td>${loadTest.metrics?.http_reqs?.count || 'N/A'}</td></tr>
      <tr><td>Failed Rate</td><td class="${(loadTest.metrics?.http_req_failed?.value || 0) > 0.05 ? 'critical' : ''}">${(loadTest.metrics?.http_req_failed?.value * 100 || 0).toFixed(2)}%</td></tr>
      <tr><td>RPS</td><td>${(loadTest.metrics?.http_reqs?.rate || 0).toFixed(2)}</td></tr>
      <tr><td>Checks Pass Rate</td><td>${((loadTest.metrics?.checks?.passes || 0) / ((loadTest.metrics?.checks?.passes || 0) + (loadTest.metrics?.checks?.fails || 0)) * 100 || 0).toFixed(1)}%</td></tr>
    </table>
  </div>

  <div class="metric-card">
    <h2>⚡ Latency (ms)</h2>
    <table>
      <tr><th>Metric</th><th>p50</th><th>p95</th><th>p99</th><th>Avg</th></tr>
      ${loadTest.metrics?.http_req_duration ? `
        <tr>
          <td>Response Time</td>
          <td>${(loadTest.metrics.http_req_duration.med || 0).toFixed(2)}</td>
          <td>${(loadTest.metrics.http_req_duration['p(95)'] || 0).toFixed(2)}</td>
          <td>${(loadTest.metrics.http_req_duration['p(99)'] || 0).toFixed(2)}</td>
          <td>${(loadTest.metrics.http_req_duration.avg || 0).toFixed(2)}</td>
        </tr>` : '<tr><td colspan="5">No latency data</td></tr>'}
    </table>
  </div>

  <div class="metric-card">
    <h2>🚀 Infrastructure Metrics</h2>
    <div class="metric-grid">
      <div>
        <h3>🧠 CPU Usage</h3>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Min</td><td>${prometheus.cpu?.cpu_min || 'N/A'}</td></tr>
          <tr><td>Max</td><td class="${(prometheus.cpu?.cpu_max || 0) > 0.8 ? 'warning' : ''}">${prometheus.cpu?.cpu_max || 'N/A'}</td></tr>
          <tr><td>Avg</td><td>${prometheus.cpu?.cpu_avg || 'N/A'}</td></tr>
        </table>
      </div>
      <div>
        <h3>💾 Memory</h3>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Min</td><td>${prometheus.memory?.mem_min || 'N/A'}</td></tr>
          <tr><td>Max</td><td>${prometheus.memory?.mem_max || 'N/A'}</td></tr>
          <tr><td>Avg</td><td>${prometheus.memory?.mem_avg || 'N/A'}</td></tr>
        </table>
      </div>
    </div>
  </div>

  <div class="metric-card">
    <h2>✅ Check Results</h2>
    <table>
      <tr><th>Check</th><th>Pass</th><th>Fail</th><th>Pass Rate</th></tr>
      ${Object.entries(loadTest.root_group?.checks || {}).map(([name, check]) => `
        <tr>
          <td>${name}</td>
          <td>${check.passes || 0}</td>
          <td>${check.fails || 0}</td>
          <td>${((check.passes / (check.passes + check.fails)) * 100 || 0).toFixed(1)}%</td>
        </tr>`).join('') || '<tr><td colspan="4">No checks</td></tr>'}
    </table>
  </div>

  <div class="timestamp" style="text-align: center; margin-top: 30px; padding: 15px; background: #f1f5f9; border-radius: 8px;">
    Generated: ${new Date().toLocaleString()} | Test Window: ${prometheus.test_window}
  </div>
</body>
</html>`;

console.log(html);

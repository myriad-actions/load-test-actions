const fetch = require('node-fetch');

class PrometheusMetrics {
  constructor() {
    this.prometheusUrl = process.env.PROMETHEUS_URL || "https://api-eu.logz.io/v1/";
    this.namespace = process.env.GITHUB_REPOSITORY_NAME || "fin-adapter-gimac-ama";
    this.container = this.namespace; 
    this.specific_metrics_prefix = process.env.METRICS_PREFIX || this.container
    this.proml_api_key = process.env.LOGZIO_TOKEN || "2f6bd25f-341b-4a8e-99c7-403888f9b288"
    this.testStart = parseInt(process.env.TEST_START_TIMESTAMP);
    this.testEnd = parseInt(process.env.TEST_END_TIMESTAMP);
    this.testDuration = this.testEnd - this.testStart;
    console.log(this.prometheusUrl || "NONE")
    console.log(this.namespace)
    console.log(this.container)
    console.log(this.specific_metrics_prefix)
    console.log(this.testDuration)
  }

  async getCpuMetrics(interval = `${this.testDuration}s`) {
    const queries = [
      `min_over_time(rate(container_cpu_usage_seconds_total{namespace="${this.namespace}",container="${this.container}",env_id="demo-eks"}[${interval}])[${interval}:])`,
      `max_over_time(rate(container_cpu_usage_seconds_total{namespace="${this.namespace}",container="${this.container}",env_id="demo-eks"}[${interval}])[${interval}:])`,
      `avg_over_time(rate(container_cpu_usage_seconds_total{namespace="${this.namespace}",container="${this.container}",env_id="demo-eks"}[${interval}])[${interval}:])`
    ];

    const results = {};
    for (let i = 0; i < queries.length; i++) {
      try {
        const data = await this.queryMetric(queries[i]);
        console.error("there")
        results[`cpu_${['min', 'max', 'avg'][i]}`] = this.parseValue(data);
      } catch (error) {
        console.error("here")
        results[`cpu_${['min', 'max', 'avg'][i]}`] = 'N/A';
      }
    }
    return results;
  }

  async getMemoryMetrics(interval = `${this.testDuration}s`) {
    const queries = [
      `sum by(container, id) (min_over_time(container_memory_working_set_bytes{namespace="${this.namespace}",container="${this.container}"}[${interval}]))`,
      `sum by(container, id) (max_over_time(container_memory_working_set_bytes{namespace="${this.namespace}",container="${this.container}"}[${interval}]))`,
      `sum by(container, id) (avg_over_time(container_memory_working_set_bytes{namespace="${this.namespace}",container="${this.container}"}[${interval}]))`
    ];

    const results = {};
    for (let i = 0; i < queries.length; i++) {
      try {
        const data = await this.queryMetric(queries[i]);
        results[`mem_${['min', 'max', 'avg'][i]}`] = this.formatBytes(this.parseValue(data));
      } catch (error) {
        results[`mem_${['min', 'max', 'avg'][i]}`] = 'N/A';
      }
    }
    return results;
  }

  async getComponentMetrics(componentMetrics = ['http_requests', 'http_request'], interval = `${this.testDuration}s`) {
    const results = {};
    for (const metric of componentMetrics) {
      const queries = [
        `round(sum(increase(${this.specific_metrics_prefix}${metric}_total[${interval}])), 1)`,
        `round(sum(increase(${this.specific_metrics_prefix}${metric}_count[${interval}])), 1)`,
        `rate(${this.specific_metrics_prefix}${metric}_duration_seconds_bucket[${interval}])`,
        `rate(${this.specific_metrics_prefix}${metric}_duration_milliseconds_bucket[${interval}])`
      ];
      for (const query of queries) {
        try {
          const data = await this.queryMetric(query);
          results[query] = data.data?.result?.length > 0 ? data.data.result[0].value[1] : "N/A";
        } catch (error) {
          results[query] = "N/A";
        }
      }
    }
    return results;
  }

  async queryMetric(promql) {
    const url = `${this.prometheusUrl}metrics/prometheus/api/v1/query?query=${encodeURIComponent(promql)}&time=${this.testEnd}`;
    const headers = {
      "X-API-TOKEN": this.proml_api_key
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Prometheus ${response.status}: ${errorText}`);
    }
    return response.json();
  }

  parseValue(data) {
    if (!data.data?.result?.length) return 0;
    const value = parseFloat(data.data.result[0].value[1]);
    return isNaN(value) ? 0 : value;
  }

  formatBytes(bytes) {
    if (bytes === 0 || bytes === 'N/A') return bytes;
    const k = 1024;
    const sizes = ['B', 'KiB', 'MiB', 'GiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getCompleteMetrics(componentMetrics = ['http_requests', 'http_request']) {
    const [cpu, mem, component] = await Promise.all([
      this.getCpuMetrics(),
      this.getMemoryMetrics(),
      this.getComponentMetrics(componentMetrics)
    ]);

    return {
      timestamp: new Date().toISOString(),
      repo: this.namespace,
      container: this.container,
      test_window: `${this.testStart}-${this.testEnd}`,
      test_duration: `${this.testDuration}s`,
      cpu,
      memory: mem,
      component_metrics: component
    };
  }
}

if (require.main === module) {
  (async () => {
    try {
      const metrics = new PrometheusMetrics();
      const results = await metrics.getCompleteMetrics();
      console.log(JSON.stringify(results, null, 2));
    } catch (error) {
      console.log(error)
      process.exit(1);
    }
  })();
}

module.exports = PrometheusMetrics;
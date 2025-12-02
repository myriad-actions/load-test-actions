export function reportSummary(data, testType) {

    return {
        "stdout": `
        ============ SUMMARY ${testType} Load Tests================
        • Total Requests:     ${data.metrics.http_reqs.values.count}
        • Failed Requests:    ${data.metrics.http_req_failed.values.rate * 100} %
        • P95 Response Time:  ${data.metrics.http_req_duration.values['p(95)']} ms
        • Avg Response Time:  ${data.metrics.http_req_duration.values.avg} ms
        `,
    };
}

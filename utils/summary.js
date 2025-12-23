export function reportSummary(data, testType) {
    const m = data.metrics;

    function val(metric, field, fallback = 0) {
        try { 
            const value = m[metric]?.values?.[field];
            return value !== undefined ? value : fallback;
        } catch { 
            return fallback; 
        }
    }

    function formatNumber(num, decimals = 2) {
        if (num === undefined || num === null || isNaN(num)) return 'N/A';
        return Number(num).toFixed(decimals);
    }

    const totalReqs = val("http_reqs", "count");
    const failRate = (val("http_req_failed", "rate", 0) * 100);
    const rps = val("http_reqs_per_second", "avg", 0);

    const p50 = val("http_req_duration", "p(50)", 0);
    const p95 = val("http_req_duration", "p(95)", 0);
    const p99 = val("http_req_duration", "p(99)", 0);
    const rtAvg = val("http_req_duration", "avg", 0);

    const vusMax = val("vus_max", "max", 0);
    const vusMean = val("vus", "avg", 0);
    const iterAvg = val("iteration_duration", "avg", 0);

    // ---- Threshold summary
    const thresholds = data.root_group?.options?.thresholds || data.options?.thresholds || {};
    let thresholdResults = "";
    
    if (Object.keys(thresholds).length > 0) {
        thresholdResults = Object.entries(thresholds)
            .map(([metric, conditions]) => {
                const metricObj = m[metric];
                let status = "❌ UNKNOWN";
                let value = "N/A";
                
                if (metricObj) {
                    const thresholdResult = metricObj.thresholds || {};
                    const passed = Object.values(thresholdResult).some(v => v === true);
                    const failed = Object.values(thresholdResult).some(v => v === false);
                    
                    if (passed && !failed) status = "✅ PASS";
                    else if (failed) status = "❌ FAIL";
                    
                    value = formatNumber(metricObj.values?.value || metricObj.values?.avg || 0);
                }
                
                return `• ${metric} = ${value} ${status}`;
            })
            .join("\n");
    } else {
        thresholdResults = "No thresholds defined.";
    }

    // Check for individual error metrics
    const errorMetrics = Object.entries(m)
        .filter(([key, metric]) => {
            if (!metric || !metric.values) return false;
            return (key.includes('error') || key.includes('status')) && 
                   (metric.values.count > 0 || metric.values.rate > 0);
        });
    
    if (errorMetrics.length > 0) {
        httpErrorsText = errorMetrics
            .map(([key, metric]) => {
                const name = metric.name || key;
                const count = metric.values?.count || 0;
                const rate = metric.values?.rate || 0;
                return `• ${name}: ${count} errors (${formatNumber(rate * 100)}%)`;
            })
            .join("\n");
    }

    // ---- ANOMALY DETECTION
    const anomalies = [];

    if (failRate > 5) anomalies.push(`⚠ High Failure Rate detected: ${formatNumber(failRate)}%`);
    if (p95 > 500) anomalies.push(`⚠ High p95 Latency: ${formatNumber(p95)} ms`);
    if (p99 > 1000) anomalies.push(`⚠ High p99 Latency: ${formatNumber(p99)} ms`);
    if (rps < 1 && totalReqs > 10) anomalies.push(`⚠ Low RPS detected: ${formatNumber(rps)}`);
    
    // Check threshold failures
    Object.entries(thresholds).forEach(([metric, conditions]) => {
        const metricObj = m[metric];
        if (metricObj && metricObj.thresholds) {
            const failedConditions = Object.entries(metricObj.thresholds)
                .filter(([_, passed]) => passed === false);
            if (failedConditions.length > 0) {
                anomalies.push(`❌ Threshold failed: ${metric} (${failedConditions.map(([cond]) => cond).join(', ')})`);
            }
        }
    });

    const anomalyText = anomalies.length > 0 
        ? anomalies.join("\n")
        : "✅ No anomalies detected.";

    // ---- STAGE-BASED BREAKING POINT DETECTION
    let breakingStageText = "No stage data available for breaking point analysis.";
    
    if (data.state?.stages && Array.isArray(data.state.stages)) {
        let breakingStage = null;
        
        for (let i = 0; i < data.state.stages.length; i++) {
            const stage = data.state.stages[i];
            const stageFailRate = (stage.metrics?.http_req_failed?.rate || 0) * 100;
            const stageP95 = stage.metrics?.http_req_duration?.p95 || 0;
            
            if (stageFailRate > 5 || stageP95 > 500) {
                breakingStage = {
                    index: i + 1,
                    name: stage.name || `Stage ${i + 1}`,
                    vus: stage.target_vus || stage.vus || 'N/A',
                    duration: stage.duration || 'N/A',
                    failRate: stageFailRate,
                    p95: stageP95
                };
                break;
            }
        }
        
        breakingStageText = breakingStage
            ? `⚠ Breaking point detected at stage "${breakingStage.name}"\n  • VUs: ${breakingStage.vus}\n  • Duration: ${breakingStage.duration}\n  • Fail Rate: ${formatNumber(breakingStage.failRate)}%\n  • P95 Latency: ${formatNumber(breakingStage.p95)} ms`
            : "✅ No breaking point detected in stages.";
    }

    const loadTestSummary = {
    test_type: testType,
    started_at: new Date(Date.now() - (data.state?.testRunDurationMs || 0)).toISOString(),
    finished_at: new Date().toISOString(),
    test_duration_ms: data.state?.testRunDurationMs || 0,
    test_duration_s: formatNumber((data.state?.testRunDurationMs || 0) / 1000, 1),
    
    executive_summary: {
      status: failRate > 5 ? "FAIL" : "PASS",
      total_requests: totalReqs,
      failed_requests_pct: formatNumber(failRate, 2),
      rps_achieved: formatNumber(rps, 2)
    },
    
    latency_ms: {
      p50: formatNumber(p50, 2),
      p95: formatNumber(p95, 2),
      p99: formatNumber(p99, 2),
      avg: formatNumber(rtAvg, 2)
    },
    
    load_profile: {
      max_vus: formatNumber(vusMax, 0),
      avg_vus: formatNumber(vusMean, 2),
      iteration_avg_ms: formatNumber(iterAvg, 2)
    },
    
    thresholds: thresholdResults,
    anomalies: anomalyText,
    breaking_point: breakingStageText
  };
    const jsonOutput = JSON.stringify(loadTestSummary, null, 2);


    return {
        'stdout': jsonOutput,
        [`summary-${testType}.json`]: jsonOutput,
    };
}

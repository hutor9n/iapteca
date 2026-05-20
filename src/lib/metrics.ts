// MTR-01: http_requests_total (Counter)
// MTR-02: http_request_duration_ms (Histogram)
// MTR-03: active_user_sessions (Gauge)
// MTR-04: order_errors_total (Counter)
// MTR-05: db_connection_status (Gauge)

class MetricsRegistry {
  private counters: Record<string, number> = {};
  private gauges: Record<string, number> = {};

  private histograms: Record<string, { sum: number; count: number }> = {};

  private getLabelsString(labels?: Record<string, string>): string {
    if (!labels) return '';
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  private getMetricKey(name: string, labels?: Record<string, string>): string {
    const labelsStr = this.getLabelsString(labels);
    return labelsStr ? `${name}{${labelsStr}}` : name;
  }

  incrementCounter(name: string, labels?: Record<string, string>, value: number = 1) {
    const key = this.getMetricKey(name, labels);
    this.counters[key] = (this.counters[key] || 0) + value;
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricKey(name, labels);
    return this.counters[key] || 0;
  }

  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getMetricKey(name, labels);
    this.gauges[key] = value;
  }

  incrementGauge(name: string, labels?: Record<string, string>, value: number = 1) {
    const key = this.getMetricKey(name, labels);
    this.gauges[key] = (this.gauges[key] || 0) + value;
  }

  decrementGauge(name: string, labels?: Record<string, string>, value: number = 1) {
    const key = this.getMetricKey(name, labels);
    this.gauges[key] = (this.gauges[key] || 0) - value;
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricKey(name, labels);
    return this.gauges[key] || 0;
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getMetricKey(name, labels);
    if (!this.histograms[key]) {
      this.histograms[key] = { sum: 0, count: 0 };
    }
    this.histograms[key].sum += value;
    this.histograms[key].count += 1;
  }

  getHistogram(name: string, labels?: Record<string, string>): { sum: number; count: number } | null {
    const key = this.getMetricKey(name, labels);
    return this.histograms[key] || null;
  }

  exportMetrics(): string {
    let output = '';

    for (const [key, value] of Object.entries(this.counters)) {
      output += `${key} ${value}\n`;
    }

    for (const [key, value] of Object.entries(this.gauges)) {
      output += `${key} ${value}\n`;
    }

    for (const [key, data] of Object.entries(this.histograms)) {
      output += `${key}_sum ${data.sum}\n`;
      output += `${key}_count ${data.count}\n`;
    }

    return output;
  }

  clear() {
    this.counters = {};
    this.gauges = {};
    this.histograms = {};
  }
}

export const metrics = new MetricsRegistry();

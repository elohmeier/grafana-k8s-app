import { full, pageScene } from '../../scenes/common';
import { statPanel, tablePanel, textPanel } from '../../scenes/panels';
import { metricsCapabilityQuery } from '../../queries/capabilities';

export function configurationScene() {
  return pageScene([
    full(
      textPanel(
        'Datasource contract',
        [
          '- Metrics: Prometheus/Thanos via `datasource`.',
          '- Logs/events: Elasticsearch via `elasticsearch`.',
          '- Infrastructure metadata: rqlite via `infraDatasource`.',
          '- Resource scoping: pod/workload/node resource panels join through Kubernetes metadata instead of filtering raw cAdvisor series by derived labels.',
          '- Label compatibility: resource panels prefer OTel semantic Kubernetes labels when present and fall back to classic kube-state/cAdvisor labels.',
          '- Alerts: severity, alert name, and category variables filter `ALERTS_FOR_STATE` and `ALERTS`.',
          '- Trend comparison: `compareWith` controls previous period, day-before, week-before, and month-before load overlays.',
          '- Runtime exclusions: Loki, InfluxDB, SQLite, Icinga, and Telegraf.',
        ].join('\n')
      ),
      220
    ),
    full(statPanel('kube-state-metrics presence', 'count(kube_node_info{cluster!=""})'), 160),
    full(
      tablePanel(
        'Capability summary',
        metricsCapabilityQuery()
      ),
      320
    ),
  ]);
}

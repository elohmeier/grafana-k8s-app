import { CLUSTER_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { tablePanel, timeseriesPanel } from '../../scenes/panels';
import {
  alertmanagerNotificationsFailed,
  alloyComponentErrors,
  prometheusRemoteWriteFailures,
  prometheusRemoteWritePending,
  prometheusScrapeFailures,
  vectorComponentErrors,
} from '../../queries/platformObservability';

export function platformObservabilityScene() {
  return pageScene(
    [
      row(
        [
          item(timeseriesPanel('Remote-write failed samples', prometheusRemoteWriteFailures(), 'ops'), '50%', 300),
          item(timeseriesPanel('Remote-write pending samples', prometheusRemoteWritePending(), 'short'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(tablePanel('Prometheus scrape failures', prometheusScrapeFailures()), '50%', 300),
          item(timeseriesPanel('Alertmanager notification failures', alertmanagerNotificationsFailed(), 'ops'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('Vector component errors', vectorComponentErrors(), 'ops'), '50%', 300),
          item(timeseriesPanel('Alloy component evaluation slowness', alloyComponentErrors(), 'ops'), '50%', 300),
        ],
        320
      ),
      full(tablePanel('Observability pipeline risks', `${prometheusScrapeFailures().trim()} or ${prometheusRemoteWritePending().trim()}`), 320),
    ],
    'now-1h',
    [],
    CLUSTER_CONTROLS
  );
}

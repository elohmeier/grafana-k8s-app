import { GLOBAL_ALERT_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { namespaceInventoryQuery } from '../../queries/entity';
import { clusterCpuUsage, clusterMemoryWorkingSet, namespaceQuota } from '../../queries/prometheus';
import { linkedTablePanel, overRequestRatioTimeseriesPanel, tablePanel, topTablePanel, timeseriesPanel } from '../../scenes/panels';
import { namespaceLink } from '../../utils/entityLinks';
import { alertsByNamespaceQuery } from '../../queries/alerts';
import { podsNotReadyByNamespace, restartHotspots } from '../../queries/health';
import {
  topCpuOverRequests,
  topCpuRequestPressure,
  topCpuRequestPressureTrend,
  topMemoryOverRequests,
  topMemoryRequestPressure,
  topMemoryRequestPressureTrend,
  topCpuConsumers,
  topCpuConsumersTrend,
  topMemoryConsumers,
  topMemoryConsumersTrend,
  weightedCpuUsageToRequests,
  weightedMemoryUsageToRequests,
} from '../../queries/resources';

export function namespacesScene() {
  return pageScene(
    [
      full(linkedTablePanel('Namespaces', namespaceInventoryQuery(), [namespaceLink()]), 320),
      row(
        [
          item(timeseriesPanel('Top CPU usage by namespace', topCpuConsumersTrend(), 'cores'), '25%', 300),
          item(timeseriesPanel('Top memory working set by namespace', topMemoryConsumersTrend(), 'bytes'), '25%', 300),
          item(timeseriesPanel('CPU usage by cluster', clusterCpuUsage(), 'cores'), '25%', 300),
          item(timeseriesPanel('Memory working set by cluster', clusterMemoryWorkingSet(), 'bytes'), '25%', 300),
        ],
        320
      ),
      row(
        [
          item(topTablePanel('Pods not ready by namespace', podsNotReadyByNamespace(), 'short', [namespaceLink()]), '25%', 280),
          item(topTablePanel('Top CPU namespaces', topCpuConsumers(), 'cores', [namespaceLink()]), '25%', 280),
          item(topTablePanel('Top memory namespaces', topMemoryConsumers(), 'bytes', [namespaceLink()]), '25%', 280),
          item(topTablePanel('Restart hotspots', restartHotspots(), 'short'), '25%', 280),
        ],
        300
      ),
      row(
        [
          item(
            overRequestRatioTimeseriesPanel('Top CPU usage / requests by namespace', topCpuRequestPressureTrend()),
            '25%',
            260
          ),
          item(
            overRequestRatioTimeseriesPanel('Top memory usage / requests by namespace', topMemoryRequestPressureTrend()),
            '25%',
            260
          ),
          item(
            overRequestRatioTimeseriesPanel('Weighted CPU usage / requests by cluster', weightedCpuUsageToRequests()),
            '25%',
            260
          ),
          item(
            overRequestRatioTimeseriesPanel('Weighted memory usage / requests by cluster', weightedMemoryUsageToRequests()),
            '25%',
            260
          ),
        ],
        280
      ),
      row(
        [
          item(topTablePanel('CPU request pressure', topCpuRequestPressure(), 'percentunit', [namespaceLink()]), '25%', 280),
          item(topTablePanel('Memory request pressure', topMemoryRequestPressure(), 'percentunit', [namespaceLink()]), '25%', 280),
          item(topTablePanel('CPU over requests', topCpuOverRequests(), 'cores', [namespaceLink()]), '25%', 280),
          item(topTablePanel('Memory over requests', topMemoryOverRequests(), 'bytes', [namespaceLink()]), '25%', 280),
        ],
        300
      ),
      full(timeseriesPanel('Firing alerts by namespace', alertsByNamespaceQuery(), 'short'), 260),
      full(tablePanel('Resource quotas', namespaceQuota()), 320),
    ],
    'now-1h',
    [],
    GLOBAL_ALERT_CONTROLS
  );
}

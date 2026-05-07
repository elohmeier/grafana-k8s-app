import { GLOBAL_ALERT_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { namespaceInventoryQuery } from '../../queries/entity';
import { namespaceCpuUsage, namespaceMemoryWorkingSet, namespaceQuota } from '../../queries/prometheus';
import { linkedTablePanel, ratioTimeseriesPanel, tablePanel, topTablePanel, timeseriesPanel } from '../../scenes/panels';
import { namespaceLink } from '../../utils/entityLinks';
import { alertsByNamespaceQuery } from '../../queries/alerts';
import { podsNotReadyByNamespace, restartHotspots } from '../../queries/health';
import {
  cpuUsageToRequests,
  memoryUsageToRequests,
  topCpuConsumers,
  topMemoryConsumers,
} from '../../queries/resources';

export function namespacesScene() {
  return pageScene(
    [
      full(linkedTablePanel('Namespaces', namespaceInventoryQuery(), [namespaceLink()]), 320),
      row(
        [
          item(timeseriesPanel('CPU usage by namespace', namespaceCpuUsage(), 'cores'), '50%', 300),
          item(timeseriesPanel('Memory working set by namespace', namespaceMemoryWorkingSet(), 'bytes'), '50%', 300),
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
          item(ratioTimeseriesPanel('CPU usage / requests by namespace', cpuUsageToRequests()), '33%', 260),
          item(
            ratioTimeseriesPanel('Memory usage / requests by namespace', memoryUsageToRequests()),
            '33%',
            260
          ),
          item(timeseriesPanel('Firing alerts by namespace', alertsByNamespaceQuery(), 'short'), '34%', 260),
        ],
        280
      ),
      full(tablePanel('Resource quotas', namespaceQuota()), 320),
    ],
    'now-1h',
    [],
    GLOBAL_ALERT_CONTROLS
  );
}

import { GLOBAL_ALERT_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { namespaceInventoryQuery } from '../../queries/entity';
import { namespaceCpuUsage, namespaceMemoryWorkingSet, namespaceQuota } from '../../queries/prometheus';
import { linkedTablePanel, tablePanel, timeseriesPanel } from '../../scenes/panels';
import { namespaceLink } from '../../utils/entityLinks';
import { alertsByNamespaceQuery } from '../../queries/alerts';
import {
  cpuUsageAvg,
  cpuUsageMax,
  cpuUsageToRequests,
  memoryUsageToRequests,
  memoryWorkingSetAvg,
  memoryWorkingSetMax,
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
          item(timeseriesPanel('CPU avg by namespace', cpuUsageAvg(), 'cores'), '25%', 280),
          item(timeseriesPanel('CPU max by namespace', cpuUsageMax(), 'cores'), '25%', 280),
          item(timeseriesPanel('Memory avg by namespace', memoryWorkingSetAvg(), 'bytes'), '25%', 280),
          item(timeseriesPanel('Memory max by namespace', memoryWorkingSetMax(), 'bytes'), '25%', 280),
        ],
        300
      ),
      row(
        [
          item(timeseriesPanel('CPU usage / requests by namespace', cpuUsageToRequests(), 'percentunit'), '33%', 260),
          item(
            timeseriesPanel('Memory usage / requests by namespace', memoryUsageToRequests(), 'percentunit'),
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

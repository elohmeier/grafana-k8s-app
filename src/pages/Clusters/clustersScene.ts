import { full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, timeseriesPanel } from '../../scenes/panels';
import { clusterInventoryQuery } from '../../queries/entity';
import { clusterCpuUsage, clusterMemoryWorkingSet, nodeConditions } from '../../queries/prometheus';
import { clusterLink, nodeLink } from '../../utils/entityLinks';
import { alertsByClusterQuery } from '../../queries/alerts';
import { cpuUsageAvg, cpuUsageMax, cpuUsageToRequests, memoryUsageToRequests, memoryWorkingSetAvg, memoryWorkingSetMax } from '../../queries/resources';

export function clustersScene() {
  return pageScene([
    full(linkedTablePanel('Clusters', clusterInventoryQuery(), [clusterLink()]), 300),
    row(
      [
        item(timeseriesPanel('CPU usage by cluster', clusterCpuUsage(), 'cores'), '50%', 300),
        item(timeseriesPanel('Memory working set by cluster', clusterMemoryWorkingSet(), 'bytes'), '50%', 300),
      ],
      320
    ),
    row(
      [
        item(timeseriesPanel('CPU avg by cluster', cpuUsageAvg(), 'cores'), '25%', 280),
        item(timeseriesPanel('CPU max by cluster', cpuUsageMax(), 'cores'), '25%', 280),
        item(timeseriesPanel('Memory avg by cluster', memoryWorkingSetAvg(), 'bytes'), '25%', 280),
        item(timeseriesPanel('Memory max by cluster', memoryWorkingSetMax(), 'bytes'), '25%', 280),
      ],
      300
    ),
    row(
      [
        item(timeseriesPanel('CPU usage / requests by cluster', cpuUsageToRequests(), 'percentunit'), '33%', 260),
        item(timeseriesPanel('Memory usage / requests by cluster', memoryUsageToRequests(), 'percentunit'), '33%', 260),
        item(timeseriesPanel('Firing alerts by cluster', alertsByClusterQuery(), 'short'), '34%', 260),
      ],
      280
    ),
    full(linkedTablePanel('Node conditions', nodeConditions(), [nodeLink()]), 320),
  ]);
}

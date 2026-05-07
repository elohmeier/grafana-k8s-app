import { CLUSTER_ALERT_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, ratioTimeseriesPanel, topTablePanel, timeseriesPanel } from '../../scenes/panels';
import { clusterInventoryQuery } from '../../queries/entity';
import { clusterCpuUsage, clusterMemoryWorkingSet, nodeConditions } from '../../queries/prometheus';
import { clusterLink, nodeLink } from '../../utils/entityLinks';
import { alertsByClusterQuery } from '../../queries/alerts';
import { nodesNotReadyByCluster, podsNotReadyByCluster } from '../../queries/health';
import {
  cpuUsageToRequests,
  memoryUsageToRequests,
} from '../../queries/resources';

export function clustersScene() {
  return pageScene(
    [
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
          item(topTablePanel('Nodes not ready by cluster', nodesNotReadyByCluster(), 'short', [clusterLink()]), '25%', 280),
          item(topTablePanel('Pods not ready by cluster', podsNotReadyByCluster(), 'short', [clusterLink()]), '25%', 280),
          item(topTablePanel('Top CPU clusters', `topk(10, ${clusterCpuUsage().trim()})`, 'cores', [clusterLink()]), '25%', 280),
          item(
            topTablePanel('Top memory clusters', `topk(10, ${clusterMemoryWorkingSet().trim()})`, 'bytes', [clusterLink()]),
            '25%',
            280
          ),
        ],
        300
      ),
      row(
        [
          item(ratioTimeseriesPanel('CPU usage / requests by cluster', cpuUsageToRequests()), '33%', 260),
          item(
            ratioTimeseriesPanel('Memory usage / requests by cluster', memoryUsageToRequests()),
            '33%',
            260
          ),
          item(timeseriesPanel('Firing alerts by cluster', alertsByClusterQuery(), 'short'), '34%', 260),
        ],
        280
      ),
      full(linkedTablePanel('Node conditions', nodeConditions(), [nodeLink()]), 320),
    ],
    'now-1h',
    [],
    CLUSTER_ALERT_CONTROLS
  );
}

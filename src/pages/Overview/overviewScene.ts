import { item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, statPanel, tablePanel, timeseriesPanel, warningStatPanel } from '../../scenes/panels';
import { alertCountQuery, globalAlertInventoryQuery } from '../../queries/alerts';
import { clusterInventoryQuery } from '../../queries/entity';
import {
  clusterCpuUsage,
  clusterMemoryWorkingSet,
  countClusters,
  countNamespaces,
  countNodes,
  countPods,
  countWorkloads,
} from '../../queries/prometheus';
import { clusterLink } from '../../utils/entityLinks';

export function overviewScene() {
  return pageScene([
    row(
      [
        item(statPanel('Clusters', countClusters()), '20%', 140),
        item(statPanel('Nodes', countNodes()), '20%', 140),
        item(statPanel('Namespaces', countNamespaces()), '20%', 140),
        item(statPanel('Workloads', countWorkloads()), '20%', 140),
        item(statPanel('Pods', countPods()), '20%', 140),
      ],
      150
    ),
    row(
      [
        item(warningStatPanel('Firing alerts', alertCountQuery()), '33%', 160),
        item(linkedTablePanel('Cluster inventory', clusterInventoryQuery(), [clusterLink()]), '33%', 220),
        item(tablePanel('Current Kubernetes alerts', globalAlertInventoryQuery()), '33%', 220),
      ],
      240
    ),
    row(
      [
        item(timeseriesPanel('CPU usage by cluster', clusterCpuUsage(), 'cores'), '50%', 300),
        item(timeseriesPanel('Memory working set by cluster', clusterMemoryWorkingSet(), 'bytes'), '50%', 300),
      ],
      320
    ),
  ]);
}

import { GLOBAL_ALERT_CONTROLS, item, pageScene, row } from '../../scenes/common';
import { criticalStatPanel, linkedTablePanel, statPanel, tablePanel, topTablePanel, warningStatPanel } from '../../scenes/panels';
import { alertCountQuery, alertsByClusterQuery, globalAlertInventoryQuery } from '../../queries/alerts';
import { clusterInventoryQuery } from '../../queries/entity';
import { nodesNotReady, podsNotReady, podsNotReadyByCluster } from '../../queries/health';
import {
  countClusters,
  countNamespaces,
  countNodes,
  countPods,
  countWorkloads,
} from '../../queries/prometheus';
import { topCpuConsumers, topMemoryConsumers } from '../../queries/resources';
import { clusterLink } from '../../utils/entityLinks';

export function overviewScene() {
  return pageScene(
    [
      row(
        [
          item(criticalStatPanel('Firing alerts', alertCountQuery()), '20%', 140),
          item(warningStatPanel('Nodes not ready', nodesNotReady()), '20%', 140),
          item(warningStatPanel('Pods not ready', podsNotReady()), '20%', 140),
          item(statPanel('Clusters', countClusters()), '20%', 140),
          item(statPanel('Pods', countPods()), '20%', 140),
        ],
        150
      ),
      row(
        [
          item(statPanel('Nodes', countNodes()), '25%', 140),
          item(statPanel('Namespaces', countNamespaces()), '25%', 140),
          item(statPanel('Workloads', countWorkloads()), '25%', 140),
          item(linkedTablePanel('Cluster inventory', clusterInventoryQuery(), [clusterLink()]), '25%', 220),
        ],
        240
      ),
      row(
        [
          item(tablePanel('Current Kubernetes alerts', globalAlertInventoryQuery()), '50%', 320),
          item(topTablePanel('Firing alerts by cluster', alertsByClusterQuery(), 'short', [clusterLink()]), '25%', 320),
          item(topTablePanel('Pods not ready by cluster', podsNotReadyByCluster(), 'short', [clusterLink()]), '25%', 320),
        ],
        340
      ),
      row(
        [
          item(topTablePanel('Top CPU consumers', topCpuConsumers(), 'cores'), '50%', 300),
          item(topTablePanel('Top memory consumers', topMemoryConsumers(), 'bytes'), '50%', 300),
        ],
        320
      ),
    ],
    'now-1h',
    [],
    GLOBAL_ALERT_CONTROLS
  );
}

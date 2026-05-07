import { full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, tablePanel, textPanel, timeseriesPanel, warningStatPanel } from '../../scenes/panels';
import { alertCountQuery, alertInventoryQuery } from '../../queries/alerts';
import { namespaceInventoryQuery, nodeInventoryQuery, podInventoryQuery, workloadInventoryQuery } from '../../queries/entity';
import {
  clusterCpuUsage,
  clusterMemoryWorkingSet,
  nodeConditions,
  podPhases,
} from '../../queries/prometheus';
import { namespaceLink, nodeLink, podLink, workloadLink } from '../../utils/entityLinks';

export function clusterDetailScene(cluster: string) {
  const scope = { cluster };

  return pageScene([
    row(
      [
        item(warningStatPanel('Firing alerts', alertCountQuery(scope)), '25%', 150),
        item(tablePanel('Pod phases', podPhases(scope)), '35%', 180),
        item(linkedTablePanel('Node conditions', nodeConditions(scope), [nodeLink()]), '40%', 180),
      ],
      200
    ),
    row(
      [
        item(timeseriesPanel('CPU usage', clusterCpuUsage(scope), 'cores'), '50%', 300),
        item(timeseriesPanel('Memory working set', clusterMemoryWorkingSet(scope), 'bytes'), '50%', 300),
      ],
      320
    ),
    full(linkedTablePanel('Namespaces in cluster', namespaceInventoryQuery(scope), [namespaceLink()]), 320),
    full(linkedTablePanel('Workloads in cluster', workloadInventoryQuery(scope), [workloadLink()]), 320),
    full(linkedTablePanel('Pods in cluster', podInventoryQuery(scope), [podLink()]), 320),
    full(linkedTablePanel('Nodes in cluster', nodeInventoryQuery(scope), [nodeLink()]), 320),
    full(tablePanel('Cluster alerts', alertInventoryQuery(scope)), 300),
    full(
      textPanel(
        'Next tabs',
        'CPU, Memory, Storage, Network, Control Plane, Operators, Logs/Events, and Alerts will be split into dedicated tab scenes after the MVP query parity pass.'
      ),
      160
    ),
  ]);
}

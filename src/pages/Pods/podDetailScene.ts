import { full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, tablePanel, timeseriesPanel, warningStatPanel } from '../../scenes/panels';
import { alertCountQuery, alertInventoryQuery } from '../../queries/alerts';
import { containerInventoryQuery } from '../../queries/entity';
import { podPhases } from '../../queries/prometheus';
import { cpuUsage, memoryWorkingSet } from '../../queries/resources';
import { podLogsLink } from '../../utils/entityLinks';

export function podDetailScene(cluster: string, namespace: string, pod: string) {
  const scope = { cluster, namespace, pod };

  return pageScene([
    row(
      [
        item(warningStatPanel('Firing alerts', alertCountQuery(scope)), '25%', 150),
        item(tablePanel('Phase', podPhases(scope)), '35%', 180),
        item(linkedTablePanel('Containers', containerInventoryQuery(scope), [podLogsLink()]), '40%', 180),
      ],
      200
    ),
    row(
      [
        item(timeseriesPanel('CPU usage', cpuUsage(scope), 'cores'), '50%', 300),
        item(timeseriesPanel('Memory working set', memoryWorkingSet(scope), 'bytes'), '50%', 300),
      ],
      320
    ),
    full(tablePanel('Pod alerts', alertInventoryQuery(scope)), 300),
  ]);
}

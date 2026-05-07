import { DETAIL_ALERT_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, tablePanel, timeseriesPanel, warningStatPanel } from '../../scenes/panels';
import { alertCountQuery, alertInventoryQuery } from '../../queries/alerts';
import { podInventoryQuery } from '../../queries/entity';
import { podPhases } from '../../queries/prometheus';
import { cpuUsage, memoryWorkingSet } from '../../queries/resources';
import { podLink } from '../../utils/entityLinks';

export function workloadDetailScene(cluster: string, namespace: string, workloadType: string, workload: string) {
  const scope = { cluster, namespace, workloadType, workload };

  return pageScene(
    [
      row(
        [
          item(warningStatPanel('Firing alerts', alertCountQuery(scope)), '25%', 150),
          item(tablePanel('Pod phases', podPhases(scope)), '35%', 180),
          item(linkedTablePanel('Pods', podInventoryQuery(scope), [podLink()]), '40%', 180),
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
      full(tablePanel('Workload alerts', alertInventoryQuery(scope)), 300),
    ],
    'now-1h',
    [],
    DETAIL_ALERT_CONTROLS
  );
}

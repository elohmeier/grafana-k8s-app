import { DETAIL_ALERT_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { alertCountQuery, alertInventoryQuery } from '../../queries/alerts';
import { podInventoryQuery, workloadInventoryQuery } from '../../queries/entity';
import { namespaceQuota, podPhases } from '../../queries/prometheus';
import { cpuUsage, cpuUsageToRequests, memoryUsageToRequests, memoryWorkingSet } from '../../queries/resources';
import { scopedPersistentVolumeRiskQuery } from '../../queries/storage';
import {
  linkedTablePanel,
  overRequestRatioTimeseriesPanel,
  tablePanel,
  timeseriesPanel,
  warningStatPanel,
} from '../../scenes/panels';
import { podLink, workloadLink } from '../../utils/entityLinks';

export function namespaceDetailScene(cluster: string, namespace: string) {
  const scope = { cluster, namespace };

  return pageScene(
    [
      row(
        [
          item(warningStatPanel('Firing alerts', alertCountQuery(scope)), '25%', 150),
          item(tablePanel('Pod phases', podPhases(scope)), '35%', 180),
          item(tablePanel('Resource quotas', namespaceQuota(scope)), '40%', 180),
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
      row(
        [
          item(overRequestRatioTimeseriesPanel('CPU usage / requests', cpuUsageToRequests(scope)), '33%', 280),
          item(overRequestRatioTimeseriesPanel('Memory usage / requests', memoryUsageToRequests(scope)), '33%', 280),
          item(tablePanel('PVC risks', scopedPersistentVolumeRiskQuery(scope)), '34%', 280),
        ],
        300
      ),
      full(linkedTablePanel('Workloads', workloadInventoryQuery(scope), [workloadLink()]), 320),
      full(linkedTablePanel('Pods', podInventoryQuery(scope), [podLink()]), 320),
      full(tablePanel('Namespace alerts', alertInventoryQuery(scope)), 300),
    ],
    'now-1h',
    [],
    DETAIL_ALERT_CONTROLS
  );
}

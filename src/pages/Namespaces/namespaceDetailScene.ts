import { full, item, pageScene, row } from '../../scenes/common';
import { alertCountQuery } from '../../queries/alerts';
import { podInventoryQuery, workloadInventoryQuery } from '../../queries/entity';
import { namespaceQuota, podPhases } from '../../queries/prometheus';
import { cpuUsage, memoryWorkingSet } from '../../queries/resources';
import { linkedTablePanel, tablePanel, textPanel, timeseriesPanel, warningStatPanel } from '../../scenes/panels';
import { podLink, workloadLink } from '../../utils/entityLinks';

export function namespaceDetailScene(cluster: string, namespace: string) {
  const scope = { cluster, namespace };

  return pageScene([
    row(
      [
        item(
          warningStatPanel('Firing alerts', alertCountQuery(scope)),
          '25%',
          150
        ),
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
    full(linkedTablePanel('Workloads', workloadInventoryQuery(scope), [workloadLink()]), 320),
    full(linkedTablePanel('Pods', podInventoryQuery(scope), [podLink()]), 320),
    full(
      textPanel(
        'Logs and metadata',
        'Elasticsearch Logs/Events and rqlite ownership metadata are intentionally separated from metrics and will be implemented with datasource-specific query builders.'
      ),
      180
    ),
  ]);
}

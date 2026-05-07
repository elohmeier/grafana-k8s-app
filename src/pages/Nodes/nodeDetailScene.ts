import { DETAIL_ALERT_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, ratioTimeseriesPanel, tablePanel, timeseriesPanel, warningStatPanel } from '../../scenes/panels';
import { alertCountQuery, alertInventoryQuery } from '../../queries/alerts';
import { nodeInventoryQuery, podInventoryQuery } from '../../queries/entity';
import { nodeConditions } from '../../queries/prometheus';
import { cpuUsage, memoryWorkingSet } from '../../queries/resources';
import { nodeCpuUtilization, nodeFilesystemUtilization, nodeMemoryUtilization, nodeOomKilledContainers } from '../../queries/node';
import { nodeLink, podLink } from '../../utils/entityLinks';

export function nodeDetailScene(cluster: string, node: string) {
  const scope = { cluster, node };

  return pageScene(
    [
      row(
        [
          item(warningStatPanel('Firing alerts', alertCountQuery(scope)), '25%', 150),
          item(linkedTablePanel('Node identity', nodeInventoryQuery(scope), [nodeLink()]), '35%', 180),
          item(tablePanel('Node conditions', nodeConditions(scope)), '40%', 180),
        ],
        200
      ),
      row(
        [
          item(timeseriesPanel('Node CPU usage', cpuUsage(scope), 'cores'), '50%', 300),
          item(timeseriesPanel('Node memory working set', memoryWorkingSet(scope), 'bytes'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(ratioTimeseriesPanel('Node CPU utilization', nodeCpuUtilization(scope)), '33%', 280),
          item(ratioTimeseriesPanel('Node memory utilization', nodeMemoryUtilization(scope)), '33%', 280),
          item(ratioTimeseriesPanel('Node filesystem utilization', nodeFilesystemUtilization(scope)), '34%', 280),
        ],
        300
      ),
      full(linkedTablePanel('OOMKilled containers on node', nodeOomKilledContainers(scope), [podLink()]), 280),
      full(linkedTablePanel('Pods on node', podInventoryQuery(scope), [podLink()]), 320),
      full(tablePanel('Node alerts', alertInventoryQuery(scope)), 300),
    ],
    'now-1h',
    [],
    DETAIL_ALERT_CONTROLS
  );
}

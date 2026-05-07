import { full, item, pageScene, row } from '../../scenes/common';
import { alertInventoryQuery, alertsByWorkloadQuery } from '../../queries/alerts';
import { workloadInventoryQuery } from '../../queries/entity';
import { linkedTablePanel, tablePanel, timeseriesPanel } from '../../scenes/panels';
import { workloadLink } from '../../utils/entityLinks';
import { cpuUsageAvg, cpuUsageMax, cpuUsageToRequests, memoryUsageToRequests, memoryWorkingSetAvg, memoryWorkingSetMax } from '../../queries/resources';

export function workloadsScene() {
  return pageScene([
    full(linkedTablePanel('Workloads', workloadInventoryQuery(), [workloadLink()]), 360),
    row(
      [
        item(timeseriesPanel('CPU avg by workload', cpuUsageAvg({ workload: '.+' }), 'cores'), '25%', 280),
        item(timeseriesPanel('CPU max by workload', cpuUsageMax({ workload: '.+' }), 'cores'), '25%', 280),
        item(timeseriesPanel('Memory avg by workload', memoryWorkingSetAvg({ workload: '.+' }), 'bytes'), '25%', 280),
        item(timeseriesPanel('Memory max by workload', memoryWorkingSetMax({ workload: '.+' }), 'bytes'), '25%', 280),
      ],
      300
    ),
    row(
      [
        item(timeseriesPanel('CPU usage / requests by workload', cpuUsageToRequests({ workload: '.+' }), 'percentunit'), '50%', 280),
        item(timeseriesPanel('Memory usage / requests by workload', memoryUsageToRequests({ workload: '.+' }), 'percentunit'), '50%', 280),
      ],
      300
    ),
    full(timeseriesPanel('Firing alerts by workload', alertsByWorkloadQuery({ workload: '.+' }), 'short'), 260),
    full(
      tablePanel('Workload alerts', alertInventoryQuery({ workload: '.+' })),
      320
    ),
  ]);
}

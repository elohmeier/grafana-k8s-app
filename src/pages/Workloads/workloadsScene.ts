import { GLOBAL_ALERT_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { alertInventoryQuery, alertsByWorkloadQuery } from '../../queries/alerts';
import { workloadInventoryQuery } from '../../queries/entity';
import { linkedTablePanel, ratioTimeseriesPanel, tablePanel, topTablePanel, timeseriesPanel } from '../../scenes/panels';
import { workloadLink } from '../../utils/entityLinks';
import {
  cpuUsageToRequests,
  memoryUsageToRequests,
  topCpuConsumers,
  topCpuUsageToRequests,
  topMemoryConsumers,
  topMemoryUsageToRequests,
} from '../../queries/resources';

export function workloadsScene() {
  return pageScene(
    [
      full(linkedTablePanel('Workloads', workloadInventoryQuery(), [workloadLink()]), 360),
      row(
        [
          item(topTablePanel('Top CPU workloads', topCpuConsumers({ workload: '.+' }), 'cores', [workloadLink()]), '25%', 280),
          item(
            topTablePanel('Top memory workloads', topMemoryConsumers({ workload: '.+' }), 'bytes', [workloadLink()]),
            '25%',
            280
          ),
          item(
            topTablePanel('CPU over requests', topCpuUsageToRequests({ workload: '.+' }), 'percentunit', [workloadLink()]),
            '25%',
            280
          ),
          item(
            topTablePanel(
              'Memory over requests',
              topMemoryUsageToRequests({ workload: '.+' }),
              'percentunit',
              [workloadLink()]
            ),
            '25%',
            280
          ),
        ],
        300
      ),
      row(
        [
          item(ratioTimeseriesPanel('CPU usage / requests by workload', cpuUsageToRequests({ workload: '.+' })), '50%', 280),
          item(
            ratioTimeseriesPanel('Memory usage / requests by workload', memoryUsageToRequests({ workload: '.+' })),
            '50%',
            280
          ),
        ],
        300
      ),
      full(timeseriesPanel('Firing alerts by workload', alertsByWorkloadQuery({ workload: '.+' }), 'short'), 260),
      full(tablePanel('Workload alerts', alertInventoryQuery({ workload: '.+' })), 320),
    ],
    'now-1h',
    [],
    GLOBAL_ALERT_CONTROLS
  );
}

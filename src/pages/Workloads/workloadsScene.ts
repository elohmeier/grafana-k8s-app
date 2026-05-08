import { GLOBAL_ALERT_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { alertInventoryQuery, alertsByWorkloadQuery } from '../../queries/alerts';
import { workloadInventoryQuery } from '../../queries/entity';
import { linkedTablePanel, overRequestRatioTimeseriesPanel, tablePanel, topTablePanel, timeseriesPanel } from '../../scenes/panels';
import { workloadLink } from '../../utils/entityLinks';
import {
  topCpuOverRequests,
  topCpuConsumers,
  topCpuRequestPressure,
  topCpuRequestPressureTrend,
  topMemoryOverRequests,
  topMemoryConsumers,
  topMemoryRequestPressure,
  topMemoryRequestPressureTrend,
  weightedCpuUsageToRequests,
  weightedMemoryUsageToRequests,
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
            topTablePanel('CPU request pressure', topCpuRequestPressure({ workload: '.+' }), 'percentunit', [workloadLink()]),
            '25%',
            280
          ),
          item(
            topTablePanel(
              'Memory request pressure',
              topMemoryRequestPressure({ workload: '.+' }),
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
          item(
            overRequestRatioTimeseriesPanel(
              'Top CPU usage / requests by workload',
              topCpuRequestPressureTrend({ workload: '.+' })
            ),
            '25%',
            280
          ),
          item(
            overRequestRatioTimeseriesPanel(
              'Top memory usage / requests by workload',
              topMemoryRequestPressureTrend({ workload: '.+' })
            ),
            '25%',
            280
          ),
          item(
            overRequestRatioTimeseriesPanel(
              'Weighted CPU usage / requests by cluster',
              weightedCpuUsageToRequests({ workload: '.+' })
            ),
            '25%',
            280
          ),
          item(
            overRequestRatioTimeseriesPanel(
              'Weighted memory usage / requests by cluster',
              weightedMemoryUsageToRequests({ workload: '.+' })
            ),
            '25%',
            280
          ),
        ],
        300
      ),
      row(
        [
          item(topTablePanel('CPU over requests', topCpuOverRequests({ workload: '.+' }), 'cores', [workloadLink()]), '50%', 280),
          item(
            topTablePanel('Memory over requests', topMemoryOverRequests({ workload: '.+' }), 'bytes', [workloadLink()]),
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

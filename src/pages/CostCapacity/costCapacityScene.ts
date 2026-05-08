import { CLUSTER_CONTROLS, item, pageScene, row } from '../../scenes/common';
import { ratioTimeseriesPanel, tablePanel, timeseriesPanel, topTablePanel } from '../../scenes/panels';
import {
  clusterCpuCapacity,
  clusterCpuRequestSaturation,
  clusterCpuRequests,
  clusterMemoryCapacity,
  clusterMemoryRequestSaturation,
  clusterMemoryRequests,
  clusterNodeCount,
  currentMonthlyClusterCost,
  dailyClusterCost,
  idleCpuCost,
  idleMemoryBytes,
  priorMonthlyClusterCost,
} from '../../queries/costCapacity';
import { metricsCapabilityQuery } from '../../queries/capabilities';

export function costCapacityScene() {
  return pageScene(
    [
      row(
        [
          item(tablePanel('Capability probes', metricsCapabilityQuery()), '33%', 220),
          item(timeseriesPanel('Nodes by cluster', clusterNodeCount(), 'short'), '33%', 220),
          item(timeseriesPanel('Daily cluster cost', dailyClusterCost(), 'currencyUSD'), '34%', 220),
        ],
        240
      ),
      row(
        [
          item(timeseriesPanel('CPU requests by cluster', clusterCpuRequests(), 'cores'), '25%', 280),
          item(timeseriesPanel('CPU allocatable by cluster', clusterCpuCapacity(), 'cores'), '25%', 280),
          item(timeseriesPanel('Memory requests by cluster', clusterMemoryRequests(), 'bytes'), '25%', 280),
          item(timeseriesPanel('Memory allocatable by cluster', clusterMemoryCapacity(), 'bytes'), '25%', 280),
        ],
        300
      ),
      row(
        [
          item(ratioTimeseriesPanel('CPU request saturation', clusterCpuRequestSaturation()), '50%', 300),
          item(ratioTimeseriesPanel('Memory request saturation', clusterMemoryRequestSaturation()), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('Current 30d cluster cost', currentMonthlyClusterCost(), 'currencyUSD'), '50%', 300),
          item(timeseriesPanel('Prior 30d cluster cost', priorMonthlyClusterCost(), 'currencyUSD'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(topTablePanel('Largest idle CPU requests', idleCpuCost(), 'cores'), '50%', 320),
          item(topTablePanel('Largest idle memory requests', idleMemoryBytes(), 'bytes'), '50%', 320),
        ],
        340
      ),
    ],
    'now-6h',
    [],
    CLUSTER_CONTROLS
  );
}

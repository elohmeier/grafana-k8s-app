import { CustomVariable, SceneByVariableRepeater, SceneFlexLayout } from '@grafana/scenes';
import { full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, overRequestRatioTimeseriesPanel, topTablePanel, timeseriesPanel } from '../../scenes/panels';
import { clusterCpuUsage, clusterMemoryWorkingSet, firingAlerts, nodeConditions } from '../../queries/prometheus';
import { clusterLink, nodeLink } from '../../utils/entityLinks';
import { nodesNotReadyByCluster, podsNotReadyByCluster } from '../../queries/health';
import { cpuUsageToRequests, memoryUsageToRequests } from '../../queries/resources';
import { clusterCostInventoryPanel, clusterUsageInventoryPanel } from './clusterInventoryPanels';

const CLUSTER_VIEW_CONTROLS = ['datasource', 'cluster', 'clusterView'] as const;

function clusterInventoryView() {
  return new SceneByVariableRepeater({
    variableName: 'clusterView',
    body: new SceneFlexLayout({
      direction: 'column',
      children: [],
    }),
    getLayoutChild: (option) => {
      const view = String(option.value);
      return full(view === 'cost' ? clusterCostInventoryPanel() : clusterUsageInventoryPanel(), 500);
    },
  });
}

export function clustersScene() {
  const clusterView = new CustomVariable({
    name: 'clusterView',
    label: 'View',
    query: 'Usage : usage, Cost : cost',
    value: 'usage',
  });
  const alertsByCluster = `sum by (cluster) (${firingAlerts().trim()})`;

  return pageScene(
    [
      full(clusterInventoryView(), 540),
      row(
        [
          item(timeseriesPanel('CPU usage by cluster', clusterCpuUsage(), 'cores'), '50%', 300),
          item(timeseriesPanel('Memory working set by cluster', clusterMemoryWorkingSet(), 'bytes'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(
            topTablePanel('Nodes not ready by cluster', nodesNotReadyByCluster(), 'short', [clusterLink()]),
            '25%',
            280
          ),
          item(
            topTablePanel('Pods not ready by cluster', podsNotReadyByCluster(), 'short', [clusterLink()]),
            '25%',
            280
          ),
          item(
            topTablePanel('Top CPU clusters', `topk(10, ${clusterCpuUsage().trim()})`, 'cores', [clusterLink()]),
            '25%',
            280
          ),
          item(
            topTablePanel('Top memory clusters', `topk(10, ${clusterMemoryWorkingSet().trim()})`, 'bytes', [
              clusterLink(),
            ]),
            '25%',
            280
          ),
        ],
        300
      ),
      row(
        [
          item(overRequestRatioTimeseriesPanel('CPU usage / requests by cluster', cpuUsageToRequests()), '33%', 260),
          item(
            overRequestRatioTimeseriesPanel('Memory usage / requests by cluster', memoryUsageToRequests()),
            '33%',
            260
          ),
          item(timeseriesPanel('Firing alerts by cluster', alertsByCluster, 'short'), '34%', 260),
        ],
        280
      ),
      full(linkedTablePanel('Node conditions', nodeConditions(), [nodeLink()]), 320),
    ],
    'now-1h',
    [clusterView],
    CLUSTER_VIEW_CONTROLS
  );
}

import { CLUSTER_ALERT_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { nodeInventoryQuery } from '../../queries/entity';
import { nodeConditions } from '../../queries/prometheus';
import { linkedTablePanel, timeseriesPanel } from '../../scenes/panels';
import { nodeLink } from '../../utils/entityLinks';
import { alertsByNodeQuery } from '../../queries/alerts';
import { nodeCpuUtilization, nodeFilesystemUtilization, nodeMemoryUtilization, nodePodCount } from '../../queries/node';

export function nodesScene() {
  return pageScene(
    [
      full(linkedTablePanel('Nodes', nodeInventoryQuery(), [nodeLink()]), 360),
      row(
        [
          item(
            timeseriesPanel(
              'Node CPU usage',
              'sum by (cluster, node) (rate(container_cpu_usage_seconds_total{cluster=~"${cluster:regex}", container!="", container!="POD"}[$__rate_interval]))',
              'cores'
            ),
            '50%',
            300
          ),
          item(
            timeseriesPanel(
              'Node memory working set',
              'sum by (cluster, node) (container_memory_working_set_bytes{cluster=~"${cluster:regex}", container!="", container!="POD"})',
              'bytes'
            ),
            '50%',
            300
          ),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('Node CPU utilization', nodeCpuUtilization(), 'percentunit'), '25%', 280),
          item(timeseriesPanel('Node memory utilization', nodeMemoryUtilization(), 'percentunit'), '25%', 280),
          item(timeseriesPanel('Node filesystem utilization', nodeFilesystemUtilization(), 'percentunit'), '25%', 280),
          item(timeseriesPanel('Pods by node', nodePodCount(), 'short'), '25%', 280),
        ],
        300
      ),
      full(timeseriesPanel('Firing alerts by node', alertsByNodeQuery({ node: '.+' }), 'short'), 260),
      full(linkedTablePanel('Node conditions', nodeConditions(), [nodeLink()]), 320),
    ],
    'now-1h',
    [],
    CLUSTER_ALERT_CONTROLS
  );
}

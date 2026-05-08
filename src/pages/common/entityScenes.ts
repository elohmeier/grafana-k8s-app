import {
  DETAIL_ALERT_CONTROLS,
  GLOBAL_ALERT_CONTROLS,
  LOG_CONTROLS,
  METADATA_CONTROLS,
  METRICS_CONTROLS,
  full,
  item,
  pageScene,
  row,
} from '../../scenes/common';
import {
  elasticsearchTablePanel,
  infraTablePanel,
  linkedTablePanel,
  overRequestRatioTimeseriesPanel,
  tablePanel,
  timeseriesPanel,
} from '../../scenes/panels';
import {
  kubernetesEventsQuery,
  kubernetesLogsQuery,
  kubernetesWarningEventsQuery,
  kubernetesWarningsAndErrorsQuery,
} from '../../queries/logs';
import { EntityScope, namespaceQuota } from '../../queries/prometheus';
import {
  cpuLimits,
  cpuRequests,
  cpuRequestsToLimits,
  cpuUsageAvg,
  cpuUsageMax,
  cpuRequestsToCapacity,
  cpuUsage,
  cpuUsageP95,
  cpuUsageP95ToRequests,
  cpuUsageToLimits,
  cpuUsageToRequests,
  memoryLimits,
  memoryRequests,
  memoryRequestsToLimits,
  memoryWorkingSetAvg,
  memoryWorkingSetMax,
  memoryRequestsToCapacity,
  memoryUsageToLimits,
  memoryUsageToRequests,
  memoryWorkingSet,
  memoryWorkingSetP95,
  memoryWorkingSetP95ToRequests,
  topCpuConsumers,
  topMemoryConsumers,
} from '../../queries/resources';
import {
  filesystemReadBytes,
  filesystemReadIops,
  filesystemWriteBytes,
  filesystemWriteIops,
  persistentVolumeAvailableBytes,
  persistentVolumeInodeUsage,
  scopedPersistentVolumeInventoryQuery,
  scopedPersistentVolumeRiskQuery,
  scopedPersistentVolumeUsageQuery,
} from '../../queries/storage';
import {
  networkDrops,
  networkErrors,
  networkReceive,
  networkReceivePackets,
  networkTransmit,
  networkTransmitPackets,
} from '../../queries/network';
import { namespaceEgressIpQuery, namespaceInfrastructureQuery, namespaceOwnershipQuery } from '../../queries/infra';
import { alertInventoryQuery, globalAlertInventoryQuery } from '../../queries/alerts';
import {
  daemonSetReadiness,
  deploymentReadiness,
  pendingPods,
  podRestartCount,
  podsNotReady,
  podWaitingReasons,
  statefulSetReadiness,
} from '../../queries/scheduling';
import {
  kubeletPlegRelistDurationP95,
  kubeletPodStartDurationP95,
  nodeCpuUtilization,
  nodeFilesystemUtilization,
  nodeImagePullFailures,
  nodeLabels,
  nodeMemoryUtilization,
  nodeOomKilledContainers,
  nodePodCount,
  nodePressureConditions,
} from '../../queries/node';
import { podLink, workloadLink } from '../../utils/entityLinks';

export function logsScene(scope: EntityScope) {
  return pageScene(
    [
      full(elasticsearchTablePanel('Logs', kubernetesLogsQuery(scope)), 360),
      full(elasticsearchTablePanel('Warnings and errors', kubernetesWarningsAndErrorsQuery(scope)), 320),
    ],
    'now-1h',
    [],
    LOG_CONTROLS
  );
}

export function eventsScene(scope: EntityScope) {
  return pageScene(
    [
      full(elasticsearchTablePanel('Events', kubernetesEventsQuery(scope)), 360),
      full(elasticsearchTablePanel('Warning events', kubernetesWarningEventsQuery(scope)), 320),
    ],
    'now-1h',
    [],
    LOG_CONTROLS
  );
}

export function namespaceMetadataScene(namespace: string) {
  return pageScene(
    [
      full(infraTablePanel('Ownership and support', namespaceOwnershipQuery(namespace)), 260),
      row(
        [
          item(infraTablePanel('Egress IP', namespaceEgressIpQuery(namespace)), '50%', 220),
          item(infraTablePanel('Related infrastructure', namespaceInfrastructureQuery(namespace)), '50%', 220),
        ],
        240
      ),
    ],
    'now-1h',
    [],
    METADATA_CONTROLS
  );
}

export function resourcesScene(scope: EntityScope) {
  return pageScene(
    [
      row(
        [
          item(timeseriesPanel('CPU usage', cpuUsage(scope), 'cores'), '50%', 300),
          item(timeseriesPanel('Memory working set', memoryWorkingSet(scope), 'bytes'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('CPU requests', cpuRequests(scope), 'cores'), '50%', 300),
          item(timeseriesPanel('CPU limits', cpuLimits(scope), 'cores'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('Memory requests', memoryRequests(scope), 'bytes'), '50%', 300),
          item(timeseriesPanel('Memory limits', memoryLimits(scope), 'bytes'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(overRequestRatioTimeseriesPanel('CPU usage / requests', cpuUsageToRequests(scope)), '50%', 300),
          item(overRequestRatioTimeseriesPanel('Memory usage / requests', memoryUsageToRequests(scope)), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(overRequestRatioTimeseriesPanel('CPU usage / limits', cpuUsageToLimits(scope)), '50%', 300),
          item(overRequestRatioTimeseriesPanel('Memory usage / limits', memoryUsageToLimits(scope)), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('CPU requests / capacity', cpuRequestsToCapacity(scope), 'percentunit'), '50%', 300),
          item(
            timeseriesPanel('Memory requests / capacity', memoryRequestsToCapacity(scope), 'percentunit'),
            '50%',
            300
          ),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('CPU p95', cpuUsageP95(scope), 'cores'), '50%', 300),
          item(timeseriesPanel('Memory p95', memoryWorkingSetP95(scope), 'bytes'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(linkedTablePanel('Top CPU consumers', topCpuConsumers(scope), [podLink()]), '50%', 300),
          item(linkedTablePanel('Top memory consumers', topMemoryConsumers(scope), [podLink()]), '50%', 300),
        ],
        320
      ),
      full(tablePanel('Resource quotas', namespaceQuota(scope)), 300),
      row(
        [
          item(linkedTablePanel('Deployment readiness', deploymentReadiness(scope), [workloadLink()]), '33%', 280),
          item(linkedTablePanel('StatefulSet readiness', statefulSetReadiness(scope), [workloadLink()]), '33%', 280),
          item(linkedTablePanel('DaemonSet readiness', daemonSetReadiness(scope), [workloadLink()]), '34%', 280),
        ],
        300
      ),
      row(
        [
          item(linkedTablePanel('Pods not ready', podsNotReady(scope), [podLink()]), '33%', 280),
          item(linkedTablePanel('Pending pods', pendingPods(scope), [podLink()]), '33%', 280),
          item(linkedTablePanel('Waiting containers', podWaitingReasons(scope), [podLink()]), '34%', 280),
        ],
        300
      ),
      full(linkedTablePanel('Container restarts over range', podRestartCount(scope), [podLink()]), 300),
    ],
    'now-1h',
    [],
    METRICS_CONTROLS
  );
}

export function cpuScene(scope: EntityScope) {
  return pageScene(
    [
      row(
        [
          item(timeseriesPanel('CPU usage', cpuUsage(scope), 'cores'), '50%', 300),
          item(timeseriesPanel('CPU requests', cpuRequests(scope), 'cores'), '25%', 300),
          item(timeseriesPanel('CPU limits', cpuLimits(scope), 'cores'), '25%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('CPU usage avg', cpuUsageAvg(scope), 'cores'), '33%', 300),
          item(timeseriesPanel('CPU usage max', cpuUsageMax(scope), 'cores'), '33%', 300),
          item(timeseriesPanel('CPU usage p95', cpuUsageP95(scope), 'cores'), '34%', 300),
        ],
        320
      ),
      row(
        [
          item(overRequestRatioTimeseriesPanel('CPU usage / requests', cpuUsageToRequests(scope)), '25%', 280),
          item(overRequestRatioTimeseriesPanel('CPU usage / limits', cpuUsageToLimits(scope)), '25%', 280),
          item(timeseriesPanel('CPU requests / limits', cpuRequestsToLimits(scope), 'percentunit'), '25%', 280),
          item(overRequestRatioTimeseriesPanel('CPU p95 / requests', cpuUsageP95ToRequests(scope)), '25%', 280),
        ],
        300
      ),
      row(
        [
          item(timeseriesPanel('CPU requests / capacity', cpuRequestsToCapacity(scope), 'percentunit'), '50%', 300),
          item(linkedTablePanel('Top CPU consumers', topCpuConsumers(scope), [podLink()]), '50%', 300),
        ],
        320
      ),
    ],
    'now-1h',
    [],
    METRICS_CONTROLS
  );
}

export function memoryScene(scope: EntityScope) {
  return pageScene(
    [
      row(
        [
          item(timeseriesPanel('Memory working set', memoryWorkingSet(scope), 'bytes'), '50%', 300),
          item(timeseriesPanel('Memory requests', memoryRequests(scope), 'bytes'), '25%', 300),
          item(timeseriesPanel('Memory limits', memoryLimits(scope), 'bytes'), '25%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('Memory usage avg', memoryWorkingSetAvg(scope), 'bytes'), '33%', 300),
          item(timeseriesPanel('Memory usage max', memoryWorkingSetMax(scope), 'bytes'), '33%', 300),
          item(timeseriesPanel('Memory usage p95', memoryWorkingSetP95(scope), 'bytes'), '34%', 300),
        ],
        320
      ),
      row(
        [
          item(overRequestRatioTimeseriesPanel('Memory usage / requests', memoryUsageToRequests(scope)), '25%', 280),
          item(overRequestRatioTimeseriesPanel('Memory usage / limits', memoryUsageToLimits(scope)), '25%', 280),
          item(timeseriesPanel('Memory requests / limits', memoryRequestsToLimits(scope), 'percentunit'), '25%', 280),
          item(
            overRequestRatioTimeseriesPanel('Memory p95 / requests', memoryWorkingSetP95ToRequests(scope)),
            '25%',
            280
          ),
        ],
        300
      ),
      row(
        [
          item(
            timeseriesPanel('Memory requests / capacity', memoryRequestsToCapacity(scope), 'percentunit'),
            '50%',
            300
          ),
          item(linkedTablePanel('Top memory consumers', topMemoryConsumers(scope), [podLink()]), '50%', 300),
        ],
        320
      ),
    ],
    'now-1h',
    [],
    METRICS_CONTROLS
  );
}

export function storageScene(scope: EntityScope) {
  return pageScene(
    [
      full(tablePanel('PVC/PV inventory', scopedPersistentVolumeInventoryQuery(scope)), 320),
      row(
        [
          item(timeseriesPanel('PVC used ratio', scopedPersistentVolumeUsageQuery(scope), 'percentunit'), '50%', 300),
          item(timeseriesPanel('PVC inode usage', persistentVolumeInodeUsage(scope), 'percentunit'), '50%', 300),
        ],
        320
      ),
      full(timeseriesPanel('PVC available bytes', persistentVolumeAvailableBytes(scope), 'bytes'), 300),
      full(tablePanel('PVC risk', scopedPersistentVolumeRiskQuery(scope)), 300),
      row(
        [
          item(timeseriesPanel('Filesystem read throughput', filesystemReadBytes(scope), 'Bps'), '50%', 300),
          item(timeseriesPanel('Filesystem write throughput', filesystemWriteBytes(scope), 'Bps'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('Filesystem read IOPS', filesystemReadIops(scope), 'iops'), '50%', 300),
          item(timeseriesPanel('Filesystem write IOPS', filesystemWriteIops(scope), 'iops'), '50%', 300),
        ],
        320
      ),
    ],
    'now-1h',
    [],
    METRICS_CONTROLS
  );
}

export function networkScene(scope: EntityScope) {
  return pageScene(
    [
      row(
        [
          item(timeseriesPanel('Network receive', networkReceive(scope), 'Bps'), '50%', 300),
          item(timeseriesPanel('Network transmit', networkTransmit(scope), 'Bps'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('Receive packets', networkReceivePackets(scope), 'pps'), '50%', 300),
          item(timeseriesPanel('Transmit packets', networkTransmitPackets(scope), 'pps'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('Packet drops', networkDrops(scope), 'pps'), '50%', 300),
          item(timeseriesPanel('Network errors', networkErrors(scope), 'pps'), '50%', 300),
        ],
        320
      ),
    ],
    'now-1h',
    [],
    METRICS_CONTROLS
  );
}

export function nodeRuntimeScene(scope: EntityScope) {
  return pageScene(
    [
      row(
        [
          item(timeseriesPanel('Node CPU utilization', nodeCpuUtilization(scope), 'percentunit'), '33%', 300),
          item(timeseriesPanel('Node memory utilization', nodeMemoryUtilization(scope), 'percentunit'), '33%', 300),
          item(
            timeseriesPanel('Node filesystem utilization', nodeFilesystemUtilization(scope), 'percentunit'),
            '34%',
            300
          ),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('Kubelet pod start p95', kubeletPodStartDurationP95(scope), 's'), '50%', 300),
          item(timeseriesPanel('Kubelet PLEG relist p95', kubeletPlegRelistDurationP95(scope), 's'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(tablePanel('Node labels', nodeLabels(scope)), '50%', 300),
          item(tablePanel('Pod count on node', nodePodCount(scope)), '50%', 300),
        ],
        320
      ),
      full(tablePanel('Node pressure conditions', nodePressureConditions(scope)), 300),
      row(
        [
          item(linkedTablePanel('Image pull failures', nodeImagePullFailures(scope), [podLink()]), '50%', 300),
          item(linkedTablePanel('OOMKilled containers', nodeOomKilledContainers(scope), [podLink()]), '50%', 300),
        ],
        320
      ),
    ],
    'now-1h',
    [],
    METRICS_CONTROLS
  );
}

export function alertsOnlyScene(scope?: EntityScope) {
  return pageScene(
    [full(tablePanel('Firing alerts', scope ? alertInventoryQuery(scope) : globalAlertInventoryQuery()), 420)],
    'now-1h',
    [],
    scope ? DETAIL_ALERT_CONTROLS : GLOBAL_ALERT_CONTROLS
  );
}

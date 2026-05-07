import { full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, tablePanel, topTablePanel, warningStatPanel } from '../../scenes/panels';
import {
  crashLoopingPods,
  nodePressureByCondition,
  nodesNotReady,
  pendingPods,
  podsNotReady,
  podsNotReadyByNamespace,
  restartHotspots,
  waitingReasonsByReason,
} from '../../queries/health';
import { nodeLink, podLink } from '../../utils/entityLinks';

export function healthScene() {
  return pageScene([
    row(
      [
        item(
          warningStatPanel('Nodes not ready', nodesNotReady()),
          '25%',
          150
        ),
        item(
          warningStatPanel('Pods not ready', podsNotReady()),
          '25%',
          150
        ),
        item(
          warningStatPanel('Crash loops', crashLoopingPods()),
          '25%',
          150
        ),
        item(warningStatPanel('Pending pods', pendingPods()), '25%', 150),
      ],
      160
    ),
    row(
      [
        item(
          linkedTablePanel('Node pressure', nodePressureByCondition(), [nodeLink()]),
          '50%',
          280
        ),
        item(topTablePanel('Pods not ready by namespace', podsNotReadyByNamespace(), 'short'), '50%', 280),
      ],
      300
    ),
    row(
      [
        item(tablePanel('Waiting reasons by namespace', waitingReasonsByReason()), '50%', 280),
        item(
          linkedTablePanel(
            'Image pull failures',
            'sum by (cluster, namespace, pod, container, reason) (kube_pod_container_status_waiting_reason{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}", reason=~"ImagePullBackOff|ErrImagePull"} > 0)',
            [podLink()]
          ),
          '50%',
          280
        ),
      ],
      300
    ),
    full(topTablePanel('Restart hotspots', restartHotspots(), 'short', [podLink()]), 300),
    full(
      linkedTablePanel(
        'OOMKilled containers',
        'max by (cluster, namespace, pod, container, reason) (kube_pod_container_status_last_terminated_reason{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}", reason="OOMKilled"} == 1)',
        [podLink()]
      ),
      300
    ),
  ]);
}

import { full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, tablePanel, topTablePanel, warningStatPanel } from '../../scenes/panels';
import {
  crashLoopingPods,
  evictedPods,
  imagePullFailures,
  nodePressureByCondition,
  nodesNotReady,
  oomKilledContainers,
  pendingPods,
  podsNotReady,
  podsNotReadyByNamespace,
  restartHotspots,
  rolloutIssues,
  unknownPods,
  waitingReasonsByReason,
  zeroReplicaDeployments,
} from '../../queries/health';
import { nodeLink, podLink, workloadLink } from '../../utils/entityLinks';

export function healthScene() {
  return pageScene([
    row(
      [
        item(warningStatPanel('Nodes not ready', nodesNotReady()), '25%', 150),
        item(warningStatPanel('Pods not ready', podsNotReady()), '25%', 150),
        item(warningStatPanel('Crash loops', crashLoopingPods()), '25%', 150),
        item(warningStatPanel('Pending pods', pendingPods()), '25%', 150),
      ],
      160
    ),
    row(
      [
        item(linkedTablePanel('Zero replica deployments', zeroReplicaDeployments(), [workloadLink()]), '50%', 280),
        item(linkedTablePanel('Deployment rollout issues', rolloutIssues(), [workloadLink()]), '50%', 280),
      ],
      300
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
        item(linkedTablePanel('Image pull failures', imagePullFailures(), [podLink()]), '50%', 280),
      ],
      300
    ),
    row(
      [
        item(linkedTablePanel('Evicted pods', evictedPods(), [podLink()]), '50%', 260),
        item(linkedTablePanel('Unknown pods', unknownPods(), [podLink()]), '50%', 260),
      ],
      280
    ),
    full(topTablePanel('Restart hotspots', restartHotspots(), 'short', [podLink()]), 300),
    full(linkedTablePanel('OOMKilled containers', oomKilledContainers(), [podLink()]), 300),
  ]);
}

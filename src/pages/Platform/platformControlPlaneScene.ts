import { CLUSTER_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { tablePanel, timeseriesPanel } from '../../scenes/panels';
import {
  apiServerLatencyP95,
  apiServerRequestRate,
  etcdBackendCommitP99,
  etcdDbSize,
  etcdLeaderChanges,
  etcdWalFsyncP99,
} from '../../queries/platformControlPlane';

export function platformControlPlaneScene() {
  return pageScene(
    [
      row(
        [
          item(timeseriesPanel('API server request rate', apiServerRequestRate(), 'rps'), '50%', 300),
          item(timeseriesPanel('API server latency p95', apiServerLatencyP95(), 's'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('etcd leader changes', etcdLeaderChanges(), 'ops'), '33%', 300),
          item(timeseriesPanel('etcd WAL fsync p99', etcdWalFsyncP99(), 's'), '33%', 300),
          item(timeseriesPanel('etcd backend commit p99', etcdBackendCommitP99(), 's'), '34%', 300),
        ],
        320
      ),
      full(timeseriesPanel('etcd DB size', etcdDbSize(), 'bytes'), 300),
      full(tablePanel('Control plane scrape failures', 'sum by (cluster, job, instance) (up{cluster=~"${cluster:regex}", job=~"apiserver|kube-apiserver|etcd|scheduler|controller-manager"} == 0)'), 300),
    ],
    'now-1h',
    [],
    CLUSTER_CONTROLS
  );
}

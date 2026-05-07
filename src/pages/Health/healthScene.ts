import { full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, warningStatPanel } from '../../scenes/panels';
import { nodeLink, podLink } from '../../utils/entityLinks';

export function healthScene() {
  return pageScene([
    row(
      [
        item(
          warningStatPanel(
            'Nodes not ready',
            'count(kube_node_status_condition{cluster=~"${cluster:regex}", condition="Ready", status=~"false|unknown"} == 1)'
          ),
          '25%',
          150
        ),
        item(
          warningStatPanel(
            'Pods not ready',
            'count(kube_pod_status_ready{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}", condition="false"} == 1)'
          ),
          '25%',
          150
        ),
        item(
          warningStatPanel(
            'Crash loops',
            'count(increase(kube_pod_container_status_restarts_total{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}"}[$__range]) > 2)'
          ),
          '25%',
          150
        ),
        item(
          warningStatPanel(
            'Pending pods',
            'count(kube_pod_status_phase{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}", phase="Pending"} == 1)'
          ),
          '25%',
          150
        ),
      ],
      160
    ),
    row(
      [
        item(
          linkedTablePanel(
            'Node pressure',
            'max by (cluster, node, condition) (kube_node_status_condition{cluster=~"${cluster:regex}", condition=~"MemoryPressure|DiskPressure|PIDPressure", status="true"} == 1)',
            [nodeLink()]
          ),
          '50%',
          280
        ),
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

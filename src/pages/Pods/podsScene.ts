import { full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, timeseriesPanel } from '../../scenes/panels';
import { podInventoryQuery } from '../../queries/entity';
import { podLink } from '../../utils/entityLinks';

export function podsScene() {
  return pageScene([
    full(linkedTablePanel('Pods', podInventoryQuery(), [podLink()]), 360),
    row(
      [
        item(
          linkedTablePanel(
            'Pods not ready',
            'max by (cluster, namespace, pod, condition) (kube_pod_status_ready{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}", condition="false"} == 1)',
            [podLink()]
          ),
          '50%',
          280
        ),
        item(
          linkedTablePanel(
            'Waiting reasons',
            'max by (cluster, namespace, pod, container, reason) (kube_pod_container_status_waiting_reason{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}", reason!=""} > 0)',
            [podLink()]
          ),
          '50%',
          280
        ),
      ],
      300
    ),
    full(
      timeseriesPanel(
        'Pod restarts',
        'sum by (cluster, namespace, pod) (increase(kube_pod_container_status_restarts_total{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}"}[$__range]))'
      ),
      300
    ),
  ]);
}

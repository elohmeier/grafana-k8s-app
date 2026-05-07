import { CLUSTER_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { tablePanel, timeseriesPanel } from '../../scenes/panels';
import {
  coreDnsErrorRate,
  coreDnsLatencyP95,
  coreDnsRequestRate,
  ingressHttpResponses,
  ovnCniRequestLatencyP95,
  ovnControllerPodCreationLatencyP95,
  ovnDaemonSetAvailability,
  ovnWorkqueueLatencyP95,
} from '../../queries/platformNetworking';

export function platformNetworkingScene() {
  return pageScene(
    [
      full(tablePanel('OVN daemonset availability', ovnDaemonSetAvailability()), 300),
      row(
        [
          item(timeseriesPanel('OVN CNI request p95', ovnCniRequestLatencyP95(), 's'), '33%', 300),
          item(timeseriesPanel('OVN pod creation p95', ovnControllerPodCreationLatencyP95(), 's'), '33%', 300),
          item(timeseriesPanel('OVN workqueue latency p95', ovnWorkqueueLatencyP95(), 's'), '34%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('CoreDNS request rate', coreDnsRequestRate(), 'qps'), '33%', 300),
          item(timeseriesPanel('CoreDNS error rate', coreDnsErrorRate(), 'qps'), '33%', 300),
          item(timeseriesPanel('CoreDNS p95 latency', coreDnsLatencyP95(), 's'), '34%', 300),
        ],
        320
      ),
      full(timeseriesPanel('Ingress HTTP responses', ingressHttpResponses(), 'rps'), 300),
    ],
    'now-1h',
    [],
    CLUSTER_CONTROLS
  );
}

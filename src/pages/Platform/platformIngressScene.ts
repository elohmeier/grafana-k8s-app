import { CLUSTER_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { tablePanel, timeseriesPanel, topTablePanel, warningStatPanel } from '../../scenes/panels';
import {
  akoHostRules,
  akoPutOperations,
  akoQueueDepth,
  akoRestOperations,
  aviIngressBandwidth,
  aviIngressDroppedConnections,
  aviIngressErrorPercent,
  aviIngressHealthScore,
  aviIngressResponseLatency,
  aviIngressResponses,
  aviLowestVirtualServiceHealth,
  aviServiceEngineHealth,
  aviTopVirtualServiceBandwidth,
  haproxyAdminSocketLatency,
  haproxyCertificateDaysRemaining,
  haproxyCertificateSigningFailures,
  haproxyControllerRunning,
  haproxyFrontendSessionsRatio,
  haproxyReloadFailures,
  ingressAverageResponseLatency,
  ingressErrorRatio,
  ingressIncomingBytes,
  ingressOutgoingBytes,
  ingressRouteCount,
  topIngressNamespacesByErrors,
  topIngressRoutesByTraffic,
  topIngressServicesByLatency,
} from '../../queries/platformIngress';

export function platformIngressScene() {
  return pageScene(
    [
      row(
        [
          item(timeseriesPanel('Ingress incoming bandwidth', ingressIncomingBytes(), 'Bps'), '25%', 220),
          item(timeseriesPanel('Ingress outgoing bandwidth', ingressOutgoingBytes(), 'Bps'), '25%', 220),
          item(timeseriesPanel('Ingress HTTP error ratio', ingressErrorRatio(), 'percentunit'), '25%', 220),
          item(timeseriesPanel('Ingress average response latency', ingressAverageResponseLatency(), 'ms'), '25%', 220),
        ],
        240
      ),
      row(
        [
          item(topTablePanel('Top routes by traffic', topIngressRoutesByTraffic(), 'Bps'), '33%', 300),
          item(topTablePanel('Top namespaces by errors', topIngressNamespacesByErrors(), 'rps'), '33%', 300),
          item(topTablePanel('Top services by latency', topIngressServicesByLatency(), 'ms'), '34%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('Ingress route count', ingressRouteCount(), 'short'), '33%', 280),
          item(timeseriesPanel('HAProxy frontend sessions / max', haproxyFrontendSessionsRatio(), 'percentunit'), '33%', 280),
          item(warningStatPanel('HAProxy reload failures', `count(${haproxyReloadFailures().trim()} > 0)`), '34%', 150),
        ],
        300
      ),
      row(
        [
          item(tablePanel('AKO HostRules', akoHostRules()), '50%', 300),
          item(timeseriesPanel('AKO queue depth', akoQueueDepth(), 'short'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('AKO REST operations', akoRestOperations(), 'ops'), '50%', 300),
          item(timeseriesPanel('AKO PUT operations', akoPutOperations(), 'ops'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('HAProxy controller running delta', haproxyControllerRunning(), 'short'), '33%', 280),
          item(timeseriesPanel('HAProxy admin socket latency', haproxyAdminSocketLatency(), 's'), '33%', 280),
          item(tablePanel('HAProxy certificate days remaining', haproxyCertificateDaysRemaining()), '34%', 280),
        ],
        300
      ),
      full(tablePanel('HAProxy certificate signing failures', haproxyCertificateSigningFailures()), 280),
      row(
        [
          item(timeseriesPanel('AVI ingress health score', aviIngressHealthScore(), 'short'), '33%', 300),
          item(timeseriesPanel('AVI ingress response error %', aviIngressErrorPercent(), 'percent'), '33%', 300),
          item(timeseriesPanel('AVI ingress response latency', aviIngressResponseLatency(), 'ms'), '34%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('AVI ingress responses', aviIngressResponses(), 'rps'), '33%', 300),
          item(timeseriesPanel('AVI ingress bandwidth', aviIngressBandwidth(), 'Bps'), '33%', 300),
          item(timeseriesPanel('AVI ingress dropped connections', aviIngressDroppedConnections(), 'cps'), '34%', 300),
        ],
        320
      ),
      row(
        [
          item(topTablePanel('Lowest AVI virtual service health', aviLowestVirtualServiceHealth(), 'short'), '33%', 300),
          item(topTablePanel('Top AVI virtual service bandwidth', aviTopVirtualServiceBandwidth(), 'Bps'), '33%', 300),
          item(topTablePanel('Lowest AVI service engine health', aviServiceEngineHealth(), 'short'), '34%', 300),
        ],
        320
      ),
    ],
    'now-1h',
    [],
    CLUSTER_CONTROLS
  );
}

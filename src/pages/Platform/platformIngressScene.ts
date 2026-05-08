import { QueryVariable } from '@grafana/scenes';
import { VariableRefresh, VariableSort } from '@grafana/schema';
import { full, item, pageScene, row } from '../../scenes/common';
import { nodeGraphPanel, tablePanel, timeseriesPanel, topTablePanel, warningStatPanel } from '../../scenes/panels';
import { PROMETHEUS_REF } from '../../constants';
import {
  akoHostRules,
  akoPutOperations,
  akoQueueDepth,
  akoRestOperations,
  aviIngressBandwidthByCluster,
  aviIngressDroppedConnectionsByCluster,
  aviIngressErrorPercentByCluster,
  aviIngressHealthScoreByCluster,
  aviIngressResponseLatencyByCluster,
  aviIngressResponsesByCluster,
  aviLowestIngressHealth,
  aviLowestVirtualServiceHealth,
  aviRoute2xxResponses,
  aviRouteHealthScore,
  aviRouteResponseLatency,
  aviServiceEngineHealth,
  aviTopIngressBandwidth,
  aviTopIngressDroppedConnections,
  aviTopIngressErrorPercent,
  aviTopIngressResponseLatency,
  aviTopIngressResponses,
  aviTopVirtualServiceBandwidth,
  haproxyAdminSocketLatency,
  haproxyCertificateDaysRemaining,
  haproxyCertificateSigningFailures,
  haproxyControllerRunning,
  haproxyFrontendSessionsRatio,
  haproxyReloadFailures,
  httpResponsesByCode,
  ingressAverageResponseLatency,
  ingressErrorRatio,
  ingressIncomingBytes,
  ingressOutgoingBytes,
  ingressRouteCount,
  netscalerChainComponents,
  netscalerLbResponses,
  netscalerLbTraffic,
  netscalerServicegroupMembers,
  netscalerTopologyEdges,
  netscalerTopologyNodes,
  openshiftRoutes,
  topIngressNamespacesByErrors,
  topIngressRoutesByTraffic,
  topIngressServicesByLatency,
} from '../../queries/platformIngress';

const INGRESS_CONTROLS = ['datasource', 'cluster', 'chain', 'lbvserver', 'servicegroup'] as const;

function netscalerVariables() {
  return [
    new QueryVariable({
      name: 'chain',
      label: 'NetScaler chain',
      datasource: PROMETHEUS_REF,
      query: 'label_values(netscaler_topology_node{chain!=""}, chain)',
      value: '$__all',
      includeAll: true,
      isMulti: true,
      allValue: '.*',
      refresh: VariableRefresh.onDashboardLoad,
      sort: VariableSort.alphabeticalAsc,
    }),
    new QueryVariable({
      name: 'lbvserver',
      label: 'LB vServer',
      datasource: PROMETHEUS_REF,
      query: 'label_values(netscaler_topology_node{chain=~".*${chain:regex}.*", node_type="lbvserver"}, title)',
      value: '$__all',
      includeAll: true,
      isMulti: true,
      allValue: '.*',
      refresh: VariableRefresh.onDashboardLoad,
      sort: VariableSort.alphabeticalAsc,
    }),
    new QueryVariable({
      name: 'servicegroup',
      label: 'Service group',
      datasource: PROMETHEUS_REF,
      query: 'label_values(netscaler_topology_node{chain=~".*${chain:regex}.*", node_type="servicegroup"}, title)',
      value: '$__all',
      includeAll: true,
      isMulti: true,
      allValue: '.*',
      refresh: VariableRefresh.onDashboardLoad,
      sort: VariableSort.alphabeticalAsc,
    }),
  ];
}

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
          item(tablePanel('OpenShift routes', openshiftRoutes()), '50%', 320),
          item(tablePanel('Route response classes', httpResponsesByCode()), '50%', 320),
        ],
        340
      ),
      row(
        [
          item(timeseriesPanel('Ingress route count', ingressRouteCount(), 'short'), '33%', 280),
          item(timeseriesPanel('HAProxy frontend sessions / max', haproxyFrontendSessionsRatio(), 'percentunit'), '33%', 280),
          item(warningStatPanel('HAProxy reload failures', `count(${haproxyReloadFailures().trim()} > 0)`), '34%', 150),
        ],
        300
      ),
      full(nodeGraphPanel('NetScaler chain topology', netscalerTopologyNodes(), netscalerTopologyEdges()), 520),
      row(
        [
          item(tablePanel('NetScaler chain components', netscalerChainComponents()), '33%', 320),
          item(tablePanel('NetScaler service group members', netscalerServicegroupMembers()), '33%', 320),
          item(timeseriesPanel('NetScaler LB request bytes', netscalerLbTraffic(), 'Bps'), '34%', 320),
        ],
        340
      ),
      full(timeseriesPanel('NetScaler LB response bytes', netscalerLbResponses(), 'Bps'), 280),
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
          item(timeseriesPanel('AVI ingress health score by cluster', aviIngressHealthScoreByCluster(), 'short'), '33%', 300),
          item(timeseriesPanel('AVI ingress response error % by cluster', aviIngressErrorPercentByCluster(), 'percent'), '33%', 300),
          item(timeseriesPanel('AVI ingress response latency by cluster', aviIngressResponseLatencyByCluster(), 'ms'), '34%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('AVI ingress responses by cluster', aviIngressResponsesByCluster(), 'rps'), '33%', 300),
          item(timeseriesPanel('AVI ingress bandwidth by cluster', aviIngressBandwidthByCluster(), 'Bps'), '33%', 300),
          item(
            timeseriesPanel('AVI ingress dropped connections by cluster', aviIngressDroppedConnectionsByCluster(), 'cps'),
            '34%',
            300
          ),
        ],
        320
      ),
      row(
        [
          item(tablePanel('AVI routes by OpenShift route', aviRouteHealthScore()), '50%', 340),
          item(timeseriesPanel('AVI route response latency', aviRouteResponseLatency(), 'ms'), '50%', 340),
        ],
        360
      ),
      full(timeseriesPanel('AVI route 2xx responses', aviRoute2xxResponses(), 'rps'), 280),
      row(
        [
          item(topTablePanel('Lowest AVI ingress health', aviLowestIngressHealth(), 'short'), '33%', 300),
          item(topTablePanel('Top AVI ingress error %', aviTopIngressErrorPercent(), 'percent'), '33%', 300),
          item(topTablePanel('Top AVI ingress latency', aviTopIngressResponseLatency(), 'ms'), '34%', 300),
        ],
        320
      ),
      row(
        [
          item(topTablePanel('Top AVI ingress responses', aviTopIngressResponses(), 'rps'), '33%', 300),
          item(topTablePanel('Top AVI ingress bandwidth', aviTopIngressBandwidth(), 'Bps'), '33%', 300),
          item(topTablePanel('Top AVI ingress dropped connections', aviTopIngressDroppedConnections(), 'cps'), '34%', 300),
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
    netscalerVariables(),
    INGRESS_CONTROLS
  );
}

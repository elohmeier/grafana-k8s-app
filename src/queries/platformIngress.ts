import { EntityScope, joinMatchers, matcher, scopedMatchers } from './prometheus';

function ingressClusterMatcher(scope: EntityScope = {}) {
  return matcher('cluster', scope.cluster ?? '${cluster:regex}');
}

function ingressRouteMatchers(scope: EntityScope = {}) {
  return joinMatchers(
    ingressClusterMatcher(scope),
    matcher('exported_namespace', scope.namespace),
    matcher('exported_pod', scope.pod)
  );
}

function workloadOwnerMatch(scope: EntityScope) {
  return scopedMatchers({
    cluster: scope.cluster,
    namespace: scope.namespace,
    workload: scope.workload,
    workloadType: scope.workloadType,
  });
}

function scopedIngressRate(metric: string, scope: EntityScope = {}, extraMatchers = '') {
  const directMatchers = joinMatchers(ingressRouteMatchers(scope), 'route!=""', extraMatchers);

  if (!scope.workload) {
    return `rate(${metric}{${directMatchers}}[$__rate_interval])`;
  }

  const workloadMetricMatchers = joinMatchers(
    ingressClusterMatcher(scope),
    'exported_namespace!=""',
    'exported_pod!=""',
    'route!=""',
    extraMatchers
  );

  return `
label_replace(
  label_replace(
    rate(${metric}{${workloadMetricMatchers}}[$__rate_interval]),
    "namespace", "$1", "exported_namespace", "(.*)"
  ),
  "pod", "$1", "exported_pod", "(.*)"
)
* on (cluster, namespace, pod) group_left(workload, workload_type)
group by (cluster, namespace, pod, workload, workload_type) (
  namespace_workload_pod:kube_pod_owner:relabel{${workloadOwnerMatch(scope)}, pod!="", workload!="", workload_type!=""}
)
`;
}

function scopedIngressGauge(metric: string, scope: EntityScope = {}, extraMatchers = '') {
  const directMatchers = joinMatchers(ingressRouteMatchers(scope), 'route!=""', extraMatchers);

  if (!scope.workload) {
    return `${metric}{${directMatchers}}`;
  }

  const workloadMetricMatchers = joinMatchers(
    ingressClusterMatcher(scope),
    'exported_namespace!=""',
    'exported_pod!=""',
    'route!=""',
    extraMatchers
  );

  return `
label_replace(
  label_replace(
    ${metric}{${workloadMetricMatchers}},
    "namespace", "$1", "exported_namespace", "(.*)"
  ),
  "pod", "$1", "exported_pod", "(.*)"
)
* on (cluster, namespace, pod) group_left(workload, workload_type)
group by (cluster, namespace, pod, workload, workload_type) (
  namespace_workload_pod:kube_pod_owner:relabel{${workloadOwnerMatch(scope)}, pod!="", workload!="", workload_type!=""}
)
`;
}

function aviRouteInfoJoin(scope: EntityScope = {}) {
  const filters = joinMatchers(
    matcher('cluster', scope.cluster ?? '${cluster:regex}'),
    matcher('namespace', scope.namespace),
    scope.workload ? matcher('to_name', scope.workload) : undefined,
    'host!=""'
  );

  return `
label_replace(
  label_replace(
    label_replace(
      label_replace(
        openshift_route_info{${filters}},
        "ocp_cluster", "$1", "cluster", "(.*)"
      ),
      "ocp_namespace", "$1", "namespace", "(.*)"
    ),
    "ocp_route", "$1", "route", "(.*)"
  ),
  "ocp_service", "$1", "to_name", "(.*)"
)
`;
}

function scopedAviRouteMetric(metric: string, scope: EntityScope = {}, extraMatchers = '') {
  const filters = joinMatchers('server_address!=""', extraMatchers);

  return `
label_replace(
  label_replace(
    ${metric}{${filters}},
    "host", "$1", "server_address", "(.*)"
  ),
  "avi_cluster", "$1", "cluster", "(.*)"
)
* on (host) group_left(ocp_cluster, ocp_namespace, ocp_route, ocp_service)
${aviRouteInfoJoin(scope).trim()}
`;
}

export function akoHostRules(scope: EntityScope = {}) {
  return `
max by (cluster, namespace, hostrule, fqdn, status) (
  ako_hostrule_info{${scopedMatchers(scope)}}
)
`;
}

export function akoRestOperations(scope: EntityScope = {}) {
  return `
sum by (cluster, pod) (
  rate(ako_ako_0_avi_system_total_rest_api_to_controller{${scopedMatchers(scope)}}[10m])
  or
  rate(ako_ako_1_avi_system_total_rest_api_to_controller{${scopedMatchers(scope)}}[10m])
)
`;
}

export function akoPutOperations(scope: EntityScope = {}) {
  return `
sum by (cluster, pod, key) (
  rate(ako_ako_0_avi_system_rest_api_to_controller{${scopedMatchers(scope)}, type="PUT"}[10m])
  or
  rate(ako_ako_1_avi_system_rest_api_to_controller{${scopedMatchers(scope)}, type="PUT"}[10m])
)
`;
}

export function akoQueueDepth(scope: EntityScope = {}) {
  return `
sum by (cluster, pod, queuename) (
  ako_ako_0_avi_system_total_objects_in_queue{${scopedMatchers(scope)}}
  or
  ako_ako_1_avi_system_total_objects_in_queue{${scopedMatchers(scope)}}
)
`;
}

export function ingressIncomingBytes(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  rate(haproxy_server_bytes_in_total{${scopedMatchers(scope)}}[$__rate_interval])
)
`;
}

export function ingressOutgoingBytes(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  rate(haproxy_server_bytes_out_total{${scopedMatchers(scope)}}[$__rate_interval])
)
`;
}

export function ingressErrorRatio(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  rate(haproxy_server_http_responses_total{${scopedMatchers(scope)}, code=~"4xx|5xx", route!=""}[$__rate_interval])
)
/
sum by (cluster) (
  rate(haproxy_server_http_responses_total{${scopedMatchers(scope)}, route!=""}[$__rate_interval])
)
`;
}

export function ingressAverageResponseLatency(scope: EntityScope = {}) {
  return `
avg by (cluster) (
  haproxy_server_http_average_response_latency_milliseconds{${scopedMatchers(scope)}} != 0
)
`;
}

export function topIngressRoutesByTraffic(scope: EntityScope = {}) {
  return `
topk(10,
  sum by (cluster, route) (
    rate(haproxy_server_bytes_in_total{${scopedMatchers(scope)}, route!=""}[$__rate_interval])
    +
    rate(haproxy_server_bytes_out_total{${scopedMatchers(scope)}, route!=""}[$__rate_interval])
  )
)
`;
}

export function topIngressNamespacesByErrors(scope: EntityScope = {}) {
  return `
topk(10,
  sum by (cluster, exported_namespace) (
    rate(haproxy_server_http_responses_total{${scopedMatchers(scope)}, exported_namespace!="", code=~"4xx|5xx"}[$__rate_interval])
  )
)
`;
}

export function topIngressServicesByLatency(scope: EntityScope = {}) {
  return `
topk(10,
  avg by (cluster, exported_namespace, exported_service) (
    haproxy_server_http_average_response_latency_milliseconds{${scopedMatchers(scope)}, exported_service!=""} != 0
  )
)
`;
}

export function ingressRouteCount(scope: EntityScope = {}) {
  return `
count by (cluster) (
  count by (cluster, route, exported_namespace, exported_service) (
    haproxy_server_up{${scopedMatchers(scope)}, route!="", exported_service!=""} == 1
  )
)
`;
}

export function httpRequestRate(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  ${scopedIngressRate('haproxy_server_http_responses_total', scope, 'code!=""').trim()}
)
`;
}

export function httpErrorRate(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  ${scopedIngressRate('haproxy_server_http_responses_total', scope, 'code=~"4xx|5xx"').trim()}
)
`;
}

export function httpErrorRatio(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  ${scopedIngressRate('haproxy_server_http_responses_total', scope, 'code=~"4xx|5xx"').trim()}
)
/
sum by (cluster) (
  ${scopedIngressRate('haproxy_server_http_responses_total', scope, 'code!=""').trim()}
)
`;
}

export function httpAverageResponseLatency(scope: EntityScope = {}) {
  return `
avg by (cluster) (
  ${scopedIngressGauge('haproxy_server_http_average_response_latency_milliseconds', scope).trim()} != 0
)
`;
}

export function httpIncomingBytes(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  ${scopedIngressRate('haproxy_server_bytes_in_total', scope).trim()}
)
`;
}

export function httpOutgoingBytes(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  ${scopedIngressRate('haproxy_server_bytes_out_total', scope).trim()}
)
`;
}

export function httpRoutesByTraffic(scope: EntityScope = {}) {
  return `
topk(10,
  sum by (cluster, namespace, workload, workload_type, route, exported_namespace, exported_service) (
    ${scopedIngressRate('haproxy_server_bytes_in_total', scope).trim()}
    +
    ${scopedIngressRate('haproxy_server_bytes_out_total', scope).trim()}
  )
)
`;
}

export function httpResponsesByCode(scope: EntityScope = {}) {
  return `
sum by (cluster, namespace, workload, workload_type, route, exported_namespace, exported_service, code) (
  ${scopedIngressRate('haproxy_server_http_responses_total', scope, 'code!=""').trim()}
)
`;
}

export function httpBackendServers(scope: EntityScope = {}) {
  return `
sum by (cluster, namespace, workload, workload_type, route, exported_namespace, exported_service, exported_pod, server) (
  ${scopedIngressRate('haproxy_server_bytes_in_total', scope).trim()}
)
`;
}

export function openshiftRoutes(scope: EntityScope = {}) {
  const filters = joinMatchers(ingressClusterMatcher(scope), matcher('namespace', scope.namespace), 'route!=""');

  return `
max by (cluster, namespace, route, host, service, to_kind, to_name, tls_termination) (
  openshift_route_info{${filters}}
)
`;
}

export function relatedAkoHostRules(scope: EntityScope = {}) {
  const filters = joinMatchers(ingressClusterMatcher(scope), matcher('exported_namespace', scope.namespace), 'fqdn!=""');

  return `
max by (cluster, exported_namespace, fqdn, name, status) (
  ako_hostrule_info{${filters}}
)
`;
}

export function aviRouteHealthScore(scope: EntityScope = {}) {
  return `
avg by (avi_cluster, tenant, service_instance_name, server_address, ocp_cluster, ocp_namespace, ocp_route, ocp_service) (
  ${scopedAviRouteMetric('avi_healthscore_health_score_value', scope, 'type="virtualservice"').trim()}
)
`;
}

export function aviRouteResponseLatency(scope: EntityScope = {}) {
  return `
avg by (avi_cluster, tenant, service_instance_name, server_address, ocp_cluster, ocp_namespace, ocp_route, ocp_service) (
  ${scopedAviRouteMetric('avi_l7_server_avg_resp_latency', scope).trim()}
)
`;
}

export function aviRoute2xxResponses(scope: EntityScope = {}) {
  return `
avg by (avi_cluster, tenant, service_instance_name, server_address, ocp_cluster, ocp_namespace, ocp_route, ocp_service) (
  ${scopedAviRouteMetric('avi_l7_client_avg_resp_2xx', scope).trim()}
)
`;
}

export function aviRoute4xxResponses(scope: EntityScope = {}) {
  return `
avg by (avi_cluster, tenant, service_instance_name, server_address, ocp_cluster, ocp_namespace, ocp_route, ocp_service) (
  ${scopedAviRouteMetric('avi_l7_client_avg_resp_4xx', scope).trim()}
)
`;
}

export function aviRoute5xxResponses(scope: EntityScope = {}) {
  return `
avg by (avi_cluster, tenant, service_instance_name, server_address, ocp_cluster, ocp_namespace, ocp_route, ocp_service) (
  ${scopedAviRouteMetric('avi_l7_client_avg_resp_5xx', scope).trim()}
)
`;
}

export function netscalerTopologyNodes() {
  return 'netscaler_topology_node{chain=~".*${chain:regex}.*"}';
}

export function netscalerTopologyEdges() {
  return 'netscaler_topology_edge{chain=~".*${chain:regex}.*"}';
}

export function netscalerChainComponents() {
  return `
max by (node_type, title, state) (
  netscaler_topology_node{chain=~".*\${chain:regex}.*"}
)
`;
}

export function netscalerLbTraffic() {
  return `
sum by (virtual_server) (
  rate(netscaler_virtual_servers_total_request_bytes{virtual_server=~"\${lbvserver:regex}"}[$__rate_interval])
)
`;
}

export function netscalerLbResponses() {
  return `
sum by (virtual_server) (
  rate(netscaler_virtual_servers_total_response_bytes{virtual_server=~"\${lbvserver:regex}"}[$__rate_interval])
)
`;
}

export function netscalerServicegroupMembers() {
  return `
max by (servicegroup, member, port) (
  netscaler_servicegroup_state{servicegroup=~"\${servicegroup:regex}"}
)
`;
}

export function haproxyControllerRunning(scope: EntityScope = {}) {
  return `
count by (cluster, hostname) (
  haproxyingress_update_success{${scopedMatchers(scope)}}
)
-
count by (cluster, hostname) (
  haproxy_process_start_time_seconds{${scopedMatchers(scope)}}
)
`;
}

export function haproxyReloadFailures(scope: EntityScope = {}) {
  return `
1 - min by (cluster, hostname) (
  haproxyingress_update_success{${scopedMatchers(scope)}}
)
`;
}

export function haproxyAdminSocketLatency(scope: EntityScope = {}) {
  return `
rate(haproxyingress_haproxy_response_time_seconds_sum{${scopedMatchers(scope)}, command="show_info"}[$__rate_interval])
/
rate(haproxyingress_haproxy_response_time_seconds_count{${scopedMatchers(scope)}, command="show_info"}[$__rate_interval])
`;
}

export function haproxyFrontendSessionsRatio(scope: EntityScope = {}) {
  return `
sum by (cluster, hostname) (
  haproxy_frontend_current_sessions{${scopedMatchers(scope)}}
)
/
max by (cluster, hostname) (
  haproxy_process_max_connections{${scopedMatchers(scope)}} > 0
)
`;
}

export function haproxyCertificateDaysRemaining(scope: EntityScope = {}) {
  return `
min by (cluster, hostname, cn) (
  (haproxyingress_cert_expire_date_epoch{${scopedMatchers(scope)}} - time()) / 86400
)
`;
}

export function haproxyCertificateSigningFailures(scope: EntityScope = {}) {
  return `
sum by (cluster, hostname, domains) (
  increase(haproxyingress_cert_signing_count{${scopedMatchers(scope)}, success="false"}[$__range])
)
`;
}

export function aviIngressHealthScore(scope: EntityScope = {}) {
  return `
avg by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_healthscore_health_score_value{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviIngressHealthScoreByCluster(scope: EntityScope = {}) {
  return `
avg by (cluster) (
  avi_healthscore_health_score_value{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviLowestIngressHealth(scope: EntityScope = {}) {
  return `
bottomk(10, ${aviIngressHealthScore(scope).trim()})
`;
}

export function aviIngressErrorPercent(scope: EntityScope = {}) {
  return `
avg by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_l7_server_pct_response_errors{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviIngressErrorPercentByCluster(scope: EntityScope = {}) {
  return `
avg by (cluster) (
  avi_l7_server_pct_response_errors{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviTopIngressErrorPercent(scope: EntityScope = {}) {
  return `
sort_desc(topk(10, ${aviIngressErrorPercent(scope).trim()}))
`;
}

export function aviIngressResponseLatency(scope: EntityScope = {}) {
  return `
avg by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_l7_server_avg_resp_latency{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviIngressResponseLatencyByCluster(scope: EntityScope = {}) {
  return `
avg by (cluster) (
  avi_l7_server_avg_resp_latency{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviTopIngressResponseLatency(scope: EntityScope = {}) {
  return `
sort_desc(topk(10, ${aviIngressResponseLatency(scope).trim()}))
`;
}

export function aviIngressResponses(scope: EntityScope = {}) {
  return `
sum by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_l7_client_sum_total_responses{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviIngressResponsesByCluster(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  avi_l7_client_sum_total_responses{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviTopIngressResponses(scope: EntityScope = {}) {
  return `
sort_desc(topk(10, ${aviIngressResponses(scope).trim()}))
`;
}

export function aviIngressBandwidth(scope: EntityScope = {}) {
  return `
sum by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_l4_client_avg_bandwidth{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviIngressBandwidthByCluster(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  avi_l4_client_avg_bandwidth{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviTopIngressBandwidth(scope: EntityScope = {}) {
  return `
sort_desc(topk(10, ${aviIngressBandwidth(scope).trim()}))
`;
}

export function aviIngressDroppedConnections(scope: EntityScope = {}) {
  return `
sum by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_l4_client_avg_connections_dropped{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviIngressDroppedConnectionsByCluster(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  avi_l4_client_avg_connections_dropped{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviTopIngressDroppedConnections(scope: EntityScope = {}) {
  return `
sort_desc(topk(10, ${aviIngressDroppedConnections(scope).trim()}))
`;
}

export function aviLowestVirtualServiceHealth(scope: EntityScope = {}) {
  return `
bottomk(10,
  avg by (cluster, tenant, service_instance_name, name) (
    avi_healthscore_health_score_value{${scopedMatchers(scope)}, type="virtualservice"}
  )
)
`;
}

export function aviTopVirtualServiceBandwidth(scope: EntityScope = {}) {
  return `
topk(10,
  sum by (cluster, tenant, service_instance_name, name) (
    avi_l4_client_avg_bandwidth{${scopedMatchers(scope)}, type="virtualservice"}
  )
)
`;
}

export function aviServiceEngineHealth(scope: EntityScope = {}) {
  return `
bottomk(10,
  avg by (cluster, tenant, service_instance_name, name) (
    avi_healthscore_health_score_value{${scopedMatchers(scope)}, type="serviceengine"}
  )
)
`;
}

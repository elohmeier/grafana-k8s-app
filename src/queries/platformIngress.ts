import { EntityScope, scopedMatchers } from './prometheus';

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
  avg by (cluster, service) (
    haproxy_server_http_average_response_latency_milliseconds{${scopedMatchers(scope)}, service!=""} != 0
  )
)
`;
}

export function ingressRouteCount(scope: EntityScope = {}) {
  return `
count by (cluster) (
  count by (cluster, route, service) (
    haproxy_server_up{${scopedMatchers(scope)}, route!="", service!=""} == 1
  )
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

export function aviIngressErrorPercent(scope: EntityScope = {}) {
  return `
avg by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_l7_server_pct_response_errors{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviIngressResponseLatency(scope: EntityScope = {}) {
  return `
avg by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_l7_server_avg_resp_latency{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviIngressResponses(scope: EntityScope = {}) {
  return `
sum by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_l7_client_sum_total_responses{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviIngressBandwidth(scope: EntityScope = {}) {
  return `
sum by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_l4_client_avg_bandwidth{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
`;
}

export function aviIngressDroppedConnections(scope: EntityScope = {}) {
  return `
sum by (cluster, tenant, service_instance_name, k8s_ingress_name) (
  avi_l4_client_avg_connections_dropped{${scopedMatchers(scope)}, k8s_ingress_name!=""}
)
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

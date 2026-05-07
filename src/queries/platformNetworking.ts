import { EntityScope, scopedMatchers } from './prometheus';

const ovnNamespace = 'namespace=~"openshift-ovn-kubernetes|ovn-kubernetes"';

export function ovnDaemonSetAvailability(scope: EntityScope = {}) {
  return `
max by (cluster, namespace, daemonset) (
  kube_daemonset_status_number_available{${scopedMatchers(scope)}, ${ovnNamespace}, daemonset!=""}
  /
  clamp_min(kube_daemonset_status_desired_number_scheduled{${scopedMatchers(scope)}, ${ovnNamespace}, daemonset!=""}, 1)
)
`;
}

export function ovnCniRequestLatencyP95(scope: EntityScope = {}) {
  return `
histogram_quantile(
  0.95,
  sum by (cluster, node, le) (
    rate(ovnkube_node_cni_request_duration_seconds_bucket{${scopedMatchers(scope)}}[$__rate_interval])
  )
)
`;
}

export function ovnControllerPodCreationLatencyP95(scope: EntityScope = {}) {
  return `
histogram_quantile(
  0.95,
  sum by (cluster, le) (
    rate(ovnkube_controller_pod_creation_latency_seconds_bucket{${scopedMatchers(scope)}}[$__rate_interval])
  )
)
`;
}

export function ovnWorkqueueLatencyP95(scope: EntityScope = {}) {
  return `
histogram_quantile(
  0.95,
  sum by (cluster, name, le) (
    rate(ovnkube_node_workqueue_queue_duration_seconds_bucket{${scopedMatchers(scope)}}[$__rate_interval])
  )
)
`;
}

export function coreDnsRequestRate(scope: EntityScope = {}) {
  return `
sum by (cluster, server, zone) (
  rate(coredns_dns_requests_total{${scopedMatchers(scope)}}[$__rate_interval])
)
`;
}

export function coreDnsErrorRate(scope: EntityScope = {}) {
  return `
sum by (cluster, rcode) (
  rate(coredns_dns_responses_total{${scopedMatchers(scope)}, rcode!~"NOERROR|NXDOMAIN"}[$__rate_interval])
)
`;
}

export function coreDnsLatencyP95(scope: EntityScope = {}) {
  return `
histogram_quantile(
  0.95,
  sum by (cluster, server, le) (
    rate(coredns_dns_request_duration_seconds_bucket{${scopedMatchers(scope)}}[$__rate_interval])
  )
)
`;
}

export function ingressHttpResponses(scope: EntityScope = {}) {
  return `
sum by (cluster, code) (
  rate(haproxy_backend_http_responses_total{${scopedMatchers(scope)}, code!=""}[$__rate_interval])
)
`;
}

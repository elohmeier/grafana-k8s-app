function capability(label: string, expr: string) {
  return `label_replace((${expr}) > bool 0, "capability", "${label}", "", "")`;
}

export function metricsCapabilityQuery() {
  return [
    capability('kube-state-metrics', 'count(kube_node_info{cluster=~"${cluster:regex}"})'),
    capability('workload recording rule', 'count(namespace_workload_pod:kube_pod_owner:relabel{cluster=~"${cluster:regex}"})'),
    capability('node exporter', 'count(node_exporter_build_info{cluster=~"${cluster:regex}"} or node_cpu_seconds_total{cluster=~"${cluster:regex}"})'),
    capability('cAdvisor/container metrics', 'count(container_cpu_usage_seconds_total{cluster=~"${cluster:regex}", container!="", container!="POD"})'),
    capability('kubelet volume stats', 'count(kubelet_volume_stats_capacity_bytes{cluster=~"${cluster:regex}"})'),
    capability('OpenShift OVN metrics', 'count(ovnkube_node_cni_request_duration_seconds_bucket{cluster=~"${cluster:regex}"} or ovnkube_controller_pod_creation_latency_seconds_bucket{cluster=~"${cluster:regex}"})'),
    capability('CoreDNS metrics', 'count(coredns_dns_requests_total{cluster=~"${cluster:regex}"})'),
    capability('Ingress HAProxy metrics', 'count(haproxy_backend_http_responses_total{cluster=~"${cluster:regex}"})'),
    capability('OpenCost metrics', 'count(opencost_build_info{cluster=~"${cluster:regex}"} or node_total_hourly_cost{cluster=~"${cluster:regex}"})'),
    capability('Kepler energy metrics', 'count(kepler_exporter_build_info{cluster=~"${cluster:regex}"} or kepler_container_package_joules_total{cluster=~"${cluster:regex}"})'),
    capability('NVIDIA/DCGM GPU metrics', 'count(node_gpu_count{cluster=~"${cluster:regex}"} or DCGM_FI_DEV_GPU_UTIL{cluster=~"${cluster:regex}"})'),
  ].join('\nor\n');
}

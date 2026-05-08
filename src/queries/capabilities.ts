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
    capability('OpenShift route ingress metrics', 'count(haproxy_server_http_responses_total{cluster=~"${cluster:regex}"} or haproxy_server_bytes_in_total{cluster=~"${cluster:regex}"})'),
    capability('HAProxy ingress controller metrics', 'count(haproxyingress_update_success{cluster=~"${cluster:regex}"} or haproxy_frontend_current_sessions{cluster=~"${cluster:regex}"})'),
    capability('AKO metrics', 'count(ako_hostrule_info{cluster=~"${cluster:regex}"} or ako_ako_0_avi_system_total_objects_in_queue{cluster=~"${cluster:regex}"})'),
    capability('AVI ingress metrics', 'count(avi_healthscore_health_score_value{cluster=~"${cluster:regex}"} or avi_l7_server_avg_resp_latency{cluster=~"${cluster:regex}"})'),
    capability('OpenCost metrics', 'count(opencost_build_info{cluster=~"${cluster:regex}"} or node_total_hourly_cost{cluster=~"${cluster:regex}"})'),
    capability('Kepler energy metrics', 'count(kepler_exporter_build_info{cluster=~"${cluster:regex}"} or kepler_container_package_joules_total{cluster=~"${cluster:regex}"})'),
    capability('NVIDIA/DCGM GPU metrics', 'count(node_gpu_count{cluster=~"${cluster:regex}"} or DCGM_FI_DEV_GPU_UTIL{cluster=~"${cluster:regex}"})'),
    capability('ArgoCD metrics', 'count(argocd_app_info{cluster=~"${cluster:regex}"})'),
    capability('cert-manager metrics', 'count(certmanager_certificate_ready_status{cluster=~"${cluster:regex}"})'),
    capability('KEDA metrics', 'count(keda_scaled_object_errors_total{cluster=~"${cluster:regex}"} or keda_scaler_detail_errors_total{cluster=~"${cluster:regex}"})'),
    capability('Kyverno metrics', 'count(kyverno_policy_results_total{cluster=~"${cluster:regex}"} or kyverno_policy_rule_info_total{cluster=~"${cluster:regex}"})'),
    capability('etcd metrics', 'count(etcd_server_has_leader{cluster=~"${cluster:regex}"} or etcd_mvcc_db_total_size_in_bytes{cluster=~"${cluster:regex}"})'),
    capability('Prometheus remote-write metrics', 'count(prometheus_remote_storage_samples_pending{cluster=~"${cluster:regex}"} or prometheus_remote_storage_failed_samples_total{cluster=~"${cluster:regex}"})'),
    capability('Vector metrics', 'count(vector_component_errors_total{cluster=~"${cluster:regex}"})'),
    capability('Alloy metrics', 'count(alloy_build_info{cluster=~"${cluster:regex}"})'),
  ].join('\nor\n');
}

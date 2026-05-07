import { CLUSTER_FILTER, NAMESPACE_FILTER, normalizedClassicOrOtel, normalizedOtelKubeMetric } from './compat';
import { EntityScope, scopedMatchers } from './prometheus';

export function clusterInventoryQuery() {
  const classic = `max by (cluster, node, provider_id, kubelet_version, container_runtime_version, os_image) (kube_node_info{cluster=~"${CLUSTER_FILTER}", node!=""})`;
  const otel = `max by (cluster, node) (${normalizedOtelKubeMetric('k8s_node_info')})`;

  return normalizedClassicOrOtel(classic, otel);
}

export function namespaceInventoryQuery(scope: EntityScope = {}) {
  const classic = `max by (cluster, namespace) (kube_namespace_status_phase{${scopedMatchers(scope)}, namespace=~"${scope.namespace ?? NAMESPACE_FILTER}", namespace!=""})`;
  const otel = `max by (cluster, namespace) (${normalizedOtelKubeMetric(
    'k8s_namespace_phase',
    scope,
    `k8s_namespace_name=~"${scope.namespace ?? NAMESPACE_FILTER}"`
  )})`;

  return normalizedClassicOrOtel(classic, otel);
}

export function workloadInventoryQuery(scope: EntityScope = {}) {
  const classic = `count by (cluster, namespace, workload, workload_type) (namespace_workload_pod:kube_pod_owner:relabel{${scopedMatchers(scope)}, namespace=~"${scope.namespace ?? NAMESPACE_FILTER}", namespace!="", workload!="", workload_type!=""})`;
  const otel = `count by (cluster, namespace, workload, workload_type) (${normalizedOtelKubeMetric(
    'k8s_workload_info',
    scope,
    `k8s_namespace_name=~"${scope.namespace ?? NAMESPACE_FILTER}"`
  )})`;

  return normalizedClassicOrOtel(classic, otel);
}

export function podInventoryQuery(scope: EntityScope = {}) {
  const classic = `max by (cluster, namespace, pod, node) (kube_pod_info{${scopedMatchers(scope)}, namespace=~"${scope.namespace ?? NAMESPACE_FILTER}", namespace!="", pod!=""})`;
  const otel = `max by (cluster, namespace, pod, node) (${normalizedOtelKubeMetric(
    'k8s_pod_info',
    scope,
    `k8s_namespace_name=~"${scope.namespace ?? NAMESPACE_FILTER}"`
  )})`;

  return normalizedClassicOrOtel(classic, otel);
}

export function containerInventoryQuery(scope: EntityScope = {}) {
  const classic = `max by (cluster, namespace, pod, container) (kube_pod_container_info{${scopedMatchers(scope)}, namespace=~"${scope.namespace ?? NAMESPACE_FILTER}", namespace!="", pod!="", container!=""})`;
  const otel = `max by (cluster, namespace, pod, container) (${normalizedOtelKubeMetric(
    'k8s_container_info',
    scope,
    `k8s_namespace_name=~"${scope.namespace ?? NAMESPACE_FILTER}"`
  )})`;

  return normalizedClassicOrOtel(classic, otel);
}

export function nodeInventoryQuery(scope: EntityScope = {}) {
  const classic = `max by (cluster, node, kernel_version, kubelet_version, container_runtime_version, os_image) (kube_node_info{${scopedMatchers(scope)}, node!=""})`;
  const otel = `max by (cluster, node) (${normalizedOtelKubeMetric('k8s_node_info', scope)})`;

  return normalizedClassicOrOtel(classic, otel);
}

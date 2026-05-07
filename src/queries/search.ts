import { normalizedClassicOrOtel, normalizedOtelKubeMetric } from './compat';

const term = '${search:regex}';

export function searchClustersQuery() {
  return normalizedClassicOrOtel(
    `topk(100, max by (cluster) (kube_node_info{cluster=~".*${term}.*"}))`,
    `topk(100, max by (cluster) (${normalizedOtelKubeMetric('k8s_node_info', {}, `k8s_cluster_name=~".*${term}.*"`)}))`
  );
}

export function searchNamespacesQuery() {
  return normalizedClassicOrOtel(
    `topk(100, max by (cluster, namespace) (kube_namespace_status_phase{namespace=~".*${term}.*"}))`,
    `topk(100, max by (cluster, namespace) (${normalizedOtelKubeMetric('k8s_namespace_phase', {}, `k8s_namespace_name=~".*${term}.*"`)}))`
  );
}

export function searchWorkloadsQuery() {
  return normalizedClassicOrOtel(
    `topk(100, count by (cluster, namespace, workload, workload_type) (namespace_workload_pod:kube_pod_owner:relabel{workload=~".*${term}.*"}))`,
    `topk(100, count by (cluster, namespace, workload, workload_type) (${normalizedOtelKubeMetric('k8s_workload_info', {}, `k8s_workload_name=~".*${term}.*"`)}))`
  );
}

export function searchPodsQuery() {
  return normalizedClassicOrOtel(
    `topk(100, max by (cluster, namespace, pod, node) (kube_pod_info{pod=~".*${term}.*"}))`,
    `topk(100, max by (cluster, namespace, pod, node) (${normalizedOtelKubeMetric('k8s_pod_info', {}, `k8s_pod_name=~".*${term}.*"`)}))`
  );
}

export function searchNodesQuery() {
  return normalizedClassicOrOtel(
    `topk(100, max by (cluster, node) (kube_node_info{node=~".*${term}.*"}))`,
    `topk(100, max by (cluster, node) (${normalizedOtelKubeMetric('k8s_node_info', {}, `k8s_node_name=~".*${term}.*"`)}))`
  );
}

export function searchContainersQuery() {
  return normalizedClassicOrOtel(
    `topk(100, max by (cluster, namespace, pod, container) (kube_pod_container_info{container=~".*${term}.*"}))`,
    `topk(100, max by (cluster, namespace, pod, container) (${normalizedOtelKubeMetric('k8s_container_info', {}, `container_name=~".*${term}.*"`)}))`
  );
}

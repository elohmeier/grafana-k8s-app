import { normalizedClassicOrOtel, normalizedOtelKubeMetric } from './compat';

const term = '${search:regex}';

function containsSearchTerm(label: string) {
  return `${label}=~\`.*${term}.*\``;
}

export function searchClustersQuery() {
  return normalizedClassicOrOtel(
    `topk(100, max by (cluster) (kube_node_info{${containsSearchTerm('cluster')}}))`,
    `topk(100, max by (cluster) (${normalizedOtelKubeMetric('k8s_node_info', {}, containsSearchTerm('k8s_cluster_name'))}))`
  );
}

export function searchNamespacesQuery() {
  return normalizedClassicOrOtel(
    `topk(100, max by (cluster, namespace) (kube_namespace_status_phase{${containsSearchTerm('namespace')}}))`,
    `topk(100, max by (cluster, namespace) (${normalizedOtelKubeMetric('k8s_namespace_phase', {}, containsSearchTerm('k8s_namespace_name'))}))`
  );
}

export function searchWorkloadsQuery() {
  return normalizedClassicOrOtel(
    `topk(100, count by (cluster, namespace, workload, workload_type) (namespace_workload_pod:kube_pod_owner:relabel{${containsSearchTerm('workload')}}))`,
    `topk(100, count by (cluster, namespace, workload, workload_type) (${normalizedOtelKubeMetric('k8s_workload_info', {}, containsSearchTerm('k8s_workload_name'))}))`
  );
}

export function searchPodsQuery() {
  return normalizedClassicOrOtel(
    `topk(100, max by (cluster, namespace, pod, node) (kube_pod_info{${containsSearchTerm('pod')}}))`,
    `topk(100, max by (cluster, namespace, pod, node) (${normalizedOtelKubeMetric('k8s_pod_info', {}, containsSearchTerm('k8s_pod_name'))}))`
  );
}

export function searchNodesQuery() {
  return normalizedClassicOrOtel(
    `topk(100, max by (cluster, node) (kube_node_info{${containsSearchTerm('node')}}))`,
    `topk(100, max by (cluster, node) (${normalizedOtelKubeMetric('k8s_node_info', {}, containsSearchTerm('k8s_node_name'))}))`
  );
}

export function searchContainersQuery() {
  return normalizedClassicOrOtel(
    `topk(100, max by (cluster, namespace, pod, container) (kube_pod_container_info{${containsSearchTerm('container')}}))`,
    `topk(100, max by (cluster, namespace, pod, container) (${normalizedOtelKubeMetric('k8s_container_info', {}, containsSearchTerm('container_name'))}))`
  );
}

export function searchPersistentVolumeClaimsQuery() {
  return `
topk(100,
  max by (cluster, namespace, persistentvolumeclaim, storageclass, volumename) (
    kube_persistentvolumeclaim_info{${containsSearchTerm('persistentvolumeclaim')}}
  )
)
`;
}

export function searchArgoCdApplicationsQuery() {
  return `
topk(100,
  max by (cluster, namespace, name, project, health_status, sync_status) (
    argocd_app_info{name=~\`.*${term}.*\`}
  )
)
`;
}

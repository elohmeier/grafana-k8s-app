import { EntityScope, scopedMatchers } from './prometheus';

function podNodeJoin(scope: EntityScope = {}) {
  if (!scope.node) {
    return '';
  }

  return `
  * on (cluster, namespace, pod) group_left(node)
  max by (cluster, namespace, pod, node) (
    kube_pod_info{${scopedMatchers({ cluster: scope.cluster, namespace: scope.namespace, node: scope.node })}, node!="", pod!=""}
  )
`;
}

export function nodeCpuUtilization(scope: EntityScope = {}) {
  return `
1 - avg by (cluster, node) (
  rate(node_cpu_seconds_total{${scopedMatchers(scope)}, mode="idle", node!=""}[$__rate_interval])
)
`;
}

export function nodeMemoryUtilization(scope: EntityScope = {}) {
  return `
1 -
(
  node_memory_MemAvailable_bytes{${scopedMatchers(scope)}, node!=""}
  /
  node_memory_MemTotal_bytes{${scopedMatchers(scope)}, node!=""}
)
`;
}

export function nodeFilesystemUtilization(scope: EntityScope = {}) {
  return `
max by (cluster, node, mountpoint, device) (
  1 -
  (
    node_filesystem_avail_bytes{${scopedMatchers(scope)}, node!="", fstype!~"tmpfs|overlay|squashfs|nsfs|tracefs", mountpoint!~"/var/lib/kubelet/pods/.+|/run/.+|/sys/.+|/proc.+"}
    /
    node_filesystem_size_bytes{${scopedMatchers(scope)}, node!="", fstype!~"tmpfs|overlay|squashfs|nsfs|tracefs", mountpoint!~"/var/lib/kubelet/pods/.+|/run/.+|/sys/.+|/proc.+"}
  )
)
`;
}

export function kubeletPodStartDurationP95(scope: EntityScope = {}) {
  return `
histogram_quantile(
  0.95,
  sum by (cluster, node, le) (
    rate(kubelet_pod_start_duration_seconds_bucket{${scopedMatchers(scope)}, node!=""}[$__rate_interval])
  )
)
`;
}

export function kubeletPlegRelistDurationP95(scope: EntityScope = {}) {
  return `
histogram_quantile(
  0.95,
  sum by (cluster, node, le) (
    rate(kubelet_pleg_relist_duration_seconds_bucket{${scopedMatchers(scope)}, node!=""}[$__rate_interval])
  )
)
`;
}

export function nodePressureConditions(scope: EntityScope = {}) {
  return `
max by (cluster, node, condition, status) (
  kube_node_status_condition{${scopedMatchers(scope)}, node!="", condition=~"MemoryPressure|DiskPressure|PIDPressure|NetworkUnavailable", status="true"}
)
`;
}

export function nodeLabels(scope: EntityScope = {}) {
  return `
max by (cluster, node, label_node_kubernetes_io_instance_type, label_kubernetes_io_arch, label_kubernetes_io_os, label_node_openshift_io_os_id, label_topology_kubernetes_io_zone) (
  kube_node_labels{${scopedMatchers(scope)}, node!=""}
)
`;
}

export function nodePodCount(scope: EntityScope = {}) {
  return `
count by (cluster, node) (
  kube_pod_info{${scopedMatchers(scope)}, node!="", pod!=""}
)
`;
}

export function nodeImagePullFailures(scope: EntityScope = {}) {
  return `
max by (cluster, namespace, node, pod, container, reason) (
  (
    kube_pod_container_status_waiting_reason{${scopedMatchers({
      cluster: scope.cluster,
      namespace: scope.namespace,
    })}, reason=~"ImagePullBackOff|ErrImagePull", pod!="", container!=""} == 1
  )
  ${podNodeJoin(scope)}
)
`;
}

export function nodeOomKilledContainers(scope: EntityScope = {}) {
  return `
max by (cluster, namespace, node, pod, container, reason) (
  (
    kube_pod_container_status_last_terminated_reason{${scopedMatchers({
      cluster: scope.cluster,
      namespace: scope.namespace,
    })}, reason="OOMKilled", pod!="", container!=""} == 1
  )
  ${podNodeJoin(scope)}
)
`;
}

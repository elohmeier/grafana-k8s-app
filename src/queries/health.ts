import { CLUSTER_FILTER, NAMESPACE_FILTER } from './compat';
import { EntityScope, scopedMatchers } from './prometheus';

export function nodesNotReady(scope: EntityScope = {}) {
  return `
count(
  kube_node_status_condition{${scopedMatchers(scope)}, condition="Ready", status=~"false|unknown"} == 1
)
`;
}

export function podsNotReady(scope: EntityScope = {}) {
  return `
count(
  kube_pod_status_ready{${scopedMatchers(scope)}, namespace=~"${scope.namespace ?? NAMESPACE_FILTER}", condition="false"} == 1
)
`;
}

export function pendingPods(scope: EntityScope = {}) {
  return `
count(
  kube_pod_status_phase{${scopedMatchers(scope)}, namespace=~"${scope.namespace ?? NAMESPACE_FILTER}", phase="Pending"} == 1
)
`;
}

export function crashLoopingPods(scope: EntityScope = {}) {
  return `
count(
  increase(kube_pod_container_status_restarts_total{${scopedMatchers(scope)}, namespace=~"${scope.namespace ?? NAMESPACE_FILTER}"}[$__range]) > 2
)
`;
}

export function nodesNotReadyByCluster() {
  return `
count by (cluster) (
  kube_node_status_condition{cluster=~"${CLUSTER_FILTER}", condition="Ready", status=~"false|unknown"} == 1
)
`;
}

export function podsNotReadyByCluster() {
  return `
count by (cluster) (
  kube_pod_status_ready{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}", condition="false"} == 1
)
`;
}

export function podsNotReadyByNamespace(scope: EntityScope = {}) {
  return `
count by (cluster, namespace) (
  kube_pod_status_ready{${scopedMatchers(scope)}, namespace=~"${scope.namespace ?? NAMESPACE_FILTER}", condition="false"} == 1
)
`;
}

export function waitingReasonsByReason(scope: EntityScope = {}) {
  return `
sum by (cluster, namespace, reason) (
  kube_pod_container_status_waiting_reason{${scopedMatchers(scope)}, namespace=~"${scope.namespace ?? NAMESPACE_FILTER}", reason!=""} > 0
)
`;
}

export function restartHotspots(scope: EntityScope = {}) {
  return `
topk(10,
  sum by (cluster, namespace, pod) (
    increase(kube_pod_container_status_restarts_total{${scopedMatchers(scope)}, namespace=~"${scope.namespace ?? NAMESPACE_FILTER}"}[$__range])
  )
)
`;
}

export function nodePressureByCondition(scope: EntityScope = {}) {
  return `
max by (cluster, node, condition) (
  kube_node_status_condition{${scopedMatchers(scope)}, condition=~"MemoryPressure|DiskPressure|PIDPressure|NetworkUnavailable", status="true"} == 1
)
`;
}

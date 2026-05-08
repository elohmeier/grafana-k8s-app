import { EntityScope, scopedMatchers } from './prometheus';

function clusterMatchers(scope: EntityScope = {}) {
  return scopedMatchers({ cluster: scope.cluster });
}

export function clusterCpuCapacity(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  kube_node_status_allocatable{${clusterMatchers(scope)}, resource="cpu"}
)
`;
}

export function clusterMemoryCapacity(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  kube_node_status_allocatable{${clusterMatchers(scope)}, resource="memory"}
)
`;
}

export function clusterCpuRequests(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  kube_pod_container_resource_requests{${clusterMatchers(scope)}, resource="cpu", container!="", container!="POD"}
)
`;
}

export function clusterMemoryRequests(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  kube_pod_container_resource_requests{${clusterMatchers(scope)}, resource="memory", container!="", container!="POD"}
)
`;
}

export function clusterCpuRequestSaturation(scope: EntityScope = {}) {
  return `
${clusterCpuRequests(scope).trim()}
/
(${clusterCpuCapacity(scope).trim()} > 0)
`;
}

export function clusterMemoryRequestSaturation(scope: EntityScope = {}) {
  return `
${clusterMemoryRequests(scope).trim()}
/
(${clusterMemoryCapacity(scope).trim()} > 0)
`;
}

export function clusterNodeCount(scope: EntityScope = {}) {
  return `
count by (cluster) (
  kube_node_info{${clusterMatchers(scope)}, node!=""}
)
`;
}

export function dailyClusterCost(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  avg_over_time(node_total_hourly_cost{${clusterMatchers(scope)}}[1d:]) * 24
)
`;
}

export function currentMonthlyClusterCost(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  sum_over_time(node_total_hourly_cost{${clusterMatchers(scope)}}[30d:1h])
)
`;
}

export function priorMonthlyClusterCost(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  sum_over_time(node_total_hourly_cost{${clusterMatchers(scope)}}[30d:1h] offset 30d)
)
`;
}

export function idleCpuCost(scope: EntityScope = {}) {
  return `
topk(20,
  sum by (cluster, namespace) (
    clamp_min(
      sum by (cluster, namespace) (
        kube_pod_container_resource_requests{${scopedMatchers(scope)}, resource="cpu", container!="", container!="POD"}
      )
      -
      sum by (cluster, namespace) (
        rate(container_cpu_usage_seconds_total{${scopedMatchers(scope)}, container!="", container!="POD"}[$__rate_interval])
      ),
      0
    )
  )
)
`;
}

export function idleMemoryBytes(scope: EntityScope = {}) {
  return `
topk(20,
  sum by (cluster, namespace) (
    clamp_min(
      sum by (cluster, namespace) (
        kube_pod_container_resource_requests{${scopedMatchers(scope)}, resource="memory", container!="", container!="POD"}
      )
      -
      sum by (cluster, namespace) (
        container_memory_working_set_bytes{${scopedMatchers(scope)}, container!="", container!="POD"}
      ),
      0
    )
  )
)
`;
}

import { normalizedClassicOrOtel, normalizedOtelKubeMetric, normalizeOtelLabels, otelScopeMatchers } from './compat';
import { EntityScope, scopedMatchers } from './prometheus';

function podScopedMatchers(scope: EntityScope = {}) {
  return scopedMatchers({
    cluster: scope.cluster,
    namespace: scope.namespace,
    pod: scope.pod,
  });
}

function podMetadataJoin(scope: EntityScope = {}) {
  const joins: string[] = [];

  if (scope.node) {
    joins.push(`
  * on (cluster, namespace, pod) group_left(node)
  max by (cluster, namespace, pod, node) (
    kube_pod_info{${scopedMatchers({ cluster: scope.cluster, namespace: scope.namespace, node: scope.node })}, pod!="", node!=""}
  )
`);
  }

  if (scope.workload || scope.workloadType) {
    joins.push(`
  * on (cluster, namespace, pod) group_left(workload, workload_type)
  group by (cluster, namespace, pod, workload, workload_type) (
    namespace_workload_pod:kube_pod_owner:relabel{${scopedMatchers({
      cluster: scope.cluster,
      namespace: scope.namespace,
      workload: scope.workload,
      workloadType: scope.workloadType,
    })}, pod!="", workload!="", workload_type!=""}
  )
`);
  }

  return joins.join('\n');
}

function resourceGroupLabels(scope: EntityScope = {}) {
  if (scope.node) {
    return 'cluster, namespace, node';
  }

  if (scope.workload || scope.workloadType) {
    return 'cluster, namespace, workload, workload_type';
  }

  if (scope.pod) {
    return 'cluster, namespace, pod';
  }

  return 'cluster, namespace';
}

function classicMetric(metric: string, scope: EntityScope = {}, extraMatchers = '') {
  const filters = [podScopedMatchers(scope), extraMatchers].filter(Boolean).join(', ');

  return `${metric}{${filters}}`;
}

function otelExtraMatchers(extraMatchers = '') {
  return extraMatchers
    .replace(/\bpod\b/g, 'k8s_pod_name')
    .replace(/\bcontainer\b/g, 'container_name')
    .replace(/\bnode\b/g, 'k8s_node_name');
}

function classicOrOtelMetric(metric: string, scope: EntityScope = {}, extraMatchers = '') {
  const podScope = { cluster: scope.cluster, namespace: scope.namespace, pod: scope.pod };

  return normalizedClassicOrOtel(
    classicMetric(metric, scope, extraMatchers),
    normalizedOtelKubeMetric(metric, podScope, otelExtraMatchers(extraMatchers))
  );
}

function classicOrOtelRateMetric(metric: string, scope: EntityScope = {}, extraMatchers = '', rangeSelector = '$__rate_interval') {
  const podScope = { cluster: scope.cluster, namespace: scope.namespace, pod: scope.pod };
  const classic = `rate(${classicMetric(metric, scope, extraMatchers)}[${rangeSelector}])`;
  const otelFilters = [otelScopeMatchers(podScope), otelExtraMatchers(extraMatchers)].filter(Boolean).join(', ');
  const otel = normalizeOtelLabels(`rate(${metric}{${otelFilters}}[${rangeSelector}])`, {
    cluster: 'k8s_cluster_name',
    namespace: 'k8s_namespace_name',
    workload: 'k8s_workload_name',
    workload_type: 'k8s_workload_type',
    pod: 'k8s_pod_name',
    node: 'k8s_node_name',
    container: 'container_name',
  });

  return normalizedClassicOrOtel(classic, otel);
}

function scopedPodSeries(metric: string, scope: EntityScope = {}, extraMatchers = '') {
  return `
(${classicOrOtelMetric(metric, scope, extraMatchers)})
${podMetadataJoin(scope)}
`;
}

function resourceSeries(metric: string, resource: 'cpu' | 'memory', scope: EntityScope = {}) {
  return scopedPodSeries(metric, scope, `resource="${resource}", pod!=""`);
}

function nodeCapacitySeries(resource: 'cpu' | 'memory', scope: EntityScope = {}) {
  return `
kube_node_status_allocatable{${scopedMatchers({ cluster: scope.cluster, node: scope.node })}, resource="${resource}"}
or
${normalizedOtelKubeMetric('kube_node_status_allocatable', { cluster: scope.cluster, node: scope.node }, `resource="${resource}"`)}
`;
}

function containerUsageSeries(metric: string, scope: EntityScope = {}, rangeSelector?: string) {
  if (rangeSelector) {
    return `
(${classicOrOtelRateMetric(metric, scope, 'container!="", container!="POD", pod!=""', rangeSelector)})
${podMetadataJoin(scope)}
`;
  }

  const series = scopedPodSeries(metric, scope, 'container!="", container!="POD", pod!=""');

  return series;
}

export function cpuUsage(scope: EntityScope = {}) {
  return `
sum by (${resourceGroupLabels(scope)}) (
  ${containerUsageSeries('container_cpu_usage_seconds_total', scope, '$__rate_interval')}
)
`;
}

export function memoryWorkingSet(scope: EntityScope = {}) {
  return `
sum by (${resourceGroupLabels(scope)}) (
  ${containerUsageSeries('container_memory_working_set_bytes', scope)}
)
`;
}

export function cpuRequests(scope: EntityScope = {}) {
  return `
sum by (${resourceGroupLabels(scope)}) (
  ${resourceSeries('kube_pod_container_resource_requests', 'cpu', scope)}
)
`;
}

export function cpuLimits(scope: EntityScope = {}) {
  return `
sum by (${resourceGroupLabels(scope)}) (
  ${resourceSeries('kube_pod_container_resource_limits', 'cpu', scope)}
)
`;
}

export function memoryRequests(scope: EntityScope = {}) {
  return `
sum by (${resourceGroupLabels(scope)}) (
  ${resourceSeries('kube_pod_container_resource_requests', 'memory', scope)}
)
`;
}

export function memoryLimits(scope: EntityScope = {}) {
  return `
sum by (${resourceGroupLabels(scope)}) (
  ${resourceSeries('kube_pod_container_resource_limits', 'memory', scope)}
)
`;
}

export function cpuUsageToRequests(scope: EntityScope = {}) {
  const labels = resourceGroupLabels(scope);

  return `
sum by (${labels}) (
  ${containerUsageSeries('container_cpu_usage_seconds_total', scope, '$__rate_interval')}
)
/
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_requests', 'cpu', scope)} > 0
)
`;
}

export function cpuUsageToLimits(scope: EntityScope = {}) {
  const labels = resourceGroupLabels(scope);

  return `
sum by (${labels}) (
  ${containerUsageSeries('container_cpu_usage_seconds_total', scope, '$__rate_interval')}
)
/
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_limits', 'cpu', scope)} > 0
)
`;
}

export function memoryUsageToRequests(scope: EntityScope = {}) {
  const labels = resourceGroupLabels(scope);

  return `
sum by (${labels}) (
  ${containerUsageSeries('container_memory_working_set_bytes', scope)}
)
/
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_requests', 'memory', scope)} > 0
)
`;
}

export function memoryUsageToLimits(scope: EntityScope = {}) {
  const labels = resourceGroupLabels(scope);

  return `
sum by (${labels}) (
  ${containerUsageSeries('container_memory_working_set_bytes', scope)}
)
/
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_limits', 'memory', scope)} > 0
)
`;
}

export function cpuRequestsToCapacity(scope: EntityScope = {}) {
  const labels = resourceGroupLabels(scope);
  const joinLabels = scope.node ? 'cluster, node' : 'cluster';

  return `
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_requests', 'cpu', scope)}
)
/
on (${joinLabels}) group_left()
sum by (${joinLabels}) (
  ${nodeCapacitySeries('cpu', scope)} > 0
)
`;
}

export function memoryRequestsToCapacity(scope: EntityScope = {}) {
  const labels = resourceGroupLabels(scope);
  const joinLabels = scope.node ? 'cluster, node' : 'cluster';

  return `
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_requests', 'memory', scope)}
)
/
on (${joinLabels}) group_left()
sum by (${joinLabels}) (
  ${nodeCapacitySeries('memory', scope)} > 0
)
`;
}

export function cpuUsageP95(scope: EntityScope = {}) {
  return `
quantile_over_time(0.95, (${cpuUsage(scope).trim()})[$__range:])
`;
}

export function memoryWorkingSetP95(scope: EntityScope = {}) {
  return `
quantile_over_time(0.95, (${memoryWorkingSet(scope).trim()})[$__range:])
`;
}

export function cpuUsageAvg(scope: EntityScope = {}) {
  return `
avg_over_time((${cpuUsage(scope).trim()})[$__range:])
`;
}

export function cpuUsageMax(scope: EntityScope = {}) {
  return `
max_over_time((${cpuUsage(scope).trim()})[$__range:])
`;
}

export function memoryWorkingSetAvg(scope: EntityScope = {}) {
  return `
avg_over_time((${memoryWorkingSet(scope).trim()})[$__range:])
`;
}

export function memoryWorkingSetMax(scope: EntityScope = {}) {
  return `
max_over_time((${memoryWorkingSet(scope).trim()})[$__range:])
`;
}

export function cpuUsageP95ToRequests(scope: EntityScope = {}) {
  const labels = resourceGroupLabels(scope);

  return `
quantile_over_time(0.95, (${cpuUsage(scope).trim()})[$__range:])
/
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_requests', 'cpu', scope)} > 0
)
`;
}

export function memoryWorkingSetP95ToRequests(scope: EntityScope = {}) {
  const labels = resourceGroupLabels(scope);

  return `
quantile_over_time(0.95, (${memoryWorkingSet(scope).trim()})[$__range:])
/
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_requests', 'memory', scope)} > 0
)
`;
}

export function cpuRequestsToLimits(scope: EntityScope = {}) {
  const labels = resourceGroupLabels(scope);

  return `
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_requests', 'cpu', scope)}
)
/
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_limits', 'cpu', scope)} > 0
)
`;
}

export function memoryRequestsToLimits(scope: EntityScope = {}) {
  const labels = resourceGroupLabels(scope);

  return `
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_requests', 'memory', scope)}
)
/
sum by (${labels}) (
  ${resourceSeries('kube_pod_container_resource_limits', 'memory', scope)} > 0
)
`;
}

export function topCpuConsumers(scope: EntityScope = {}) {
  return `
topk(10, ${cpuUsage(scope).trim()})
`;
}

export function topMemoryConsumers(scope: EntityScope = {}) {
  return `
topk(10, ${memoryWorkingSet(scope).trim()})
`;
}

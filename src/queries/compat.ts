import { EntityScope, joinMatchers, matcher } from './prometheus';

export const CLUSTER_FILTER = '${cluster:regex}';
export const NAMESPACE_FILTER = '${namespace:regex}';

export function normalizeOtelLabel(expr: string, targetLabel: string, otelLabel: string) {
  return `label_replace(${expr}, "${targetLabel}", "$1", "${otelLabel}", "(.+)")`;
}

export function normalizeOtelLabels(expr: string, mappings: Record<string, string>) {
  return Object.entries(mappings).reduce((acc, [targetLabel, otelLabel]) => normalizeOtelLabel(acc, targetLabel, otelLabel), expr);
}

export function otelScopeMatchers(scope: EntityScope = {}) {
  return joinMatchers(
    matcher('k8s_cluster_name', scope.cluster ?? CLUSTER_FILTER),
    matcher('k8s_namespace_name', scope.namespace),
    matcher('k8s_workload_name', scope.workload),
    matcher('k8s_workload_type', scope.workloadType),
    matcher('k8s_pod_name', scope.pod),
    matcher('k8s_node_name', scope.node)
  );
}

export function normalizedOtelKubeMetric(metric: string, scope: EntityScope = {}, extraMatchers = '') {
  const filters = joinMatchers(otelScopeMatchers(scope), extraMatchers);

  return normalizeOtelLabels(`${metric}{${filters}}`, {
    cluster: 'k8s_cluster_name',
    namespace: 'k8s_namespace_name',
    workload: 'k8s_workload_name',
    workload_type: 'k8s_workload_type',
    pod: 'k8s_pod_name',
    node: 'k8s_node_name',
    container: 'container_name',
  });
}

export function normalizedClassicOrOtel(classicExpr: string, otelExpr: string) {
  return `(${otelExpr}) or (${classicExpr})`;
}

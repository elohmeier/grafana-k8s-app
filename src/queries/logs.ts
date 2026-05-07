import { EntityScope } from './prometheus';

function luceneValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function lucenePrefixValue(value: string) {
  return value.replace(/([+\-&|!(){}[\]^"~?:\\/])/g, '\\$1').replace(/\s/g, '\\ ');
}

function quoted(value: string) {
  return `"${luceneValue(value)}"`;
}

function clusterFilter(scope: EntityScope) {
  if (!scope.cluster) {
    return '';
  }

  const cluster = quoted(scope.cluster);
  const upperCluster = quoted(scope.cluster.toUpperCase());

  return ` AND (orchestrator.cluster.name:${cluster} OR kubernetes.cluster.name:${cluster} OR k8s.cluster.name:${cluster} OR k8s_cluster_name:${cluster} OR cluster:${cluster} OR service.environment:${cluster} OR service.environment:${upperCluster})`;
}

function namespaceFilter(scope: EntityScope) {
  return scope.namespace ? `orchestrator.namespace:(${quoted(scope.namespace)})` : 'orchestrator.namespace:(${namespace:lucene})';
}

function resourceFilter(scope: EntityScope) {
  if (scope.pod) {
    return ` AND orchestrator.resource.name:(${quoted(scope.pod)})`;
  }

  if (scope.workload) {
    return ` AND orchestrator.resource.name:(${lucenePrefixValue(scope.workload)}*)`;
  }

  return '';
}

export function kubernetesLogsQuery(scope: EntityScope = {}) {
  return `(NOT logmgmt.category:event${clusterFilter(scope)} AND ${namespaceFilter(
    scope
  )}${resourceFilter(scope)})`;
}

export function kubernetesWarningsAndErrorsQuery(scope: EntityScope = {}) {
  return `(NOT logmgmt.category:event${clusterFilter(scope)} AND ${namespaceFilter(
    scope
  )}${resourceFilter(scope)} AND (log.level:error OR log.level:warn))`;
}

export function kubernetesEventsQuery(scope: EntityScope = {}) {
  return `(logmgmt.category:event${clusterFilter(scope)} AND ${namespaceFilter(
    scope
  )}${resourceFilter(scope)})`;
}

export function kubernetesWarningEventsQuery(scope: EntityScope = {}) {
  return `(logmgmt.category:event${clusterFilter(scope)} AND ${namespaceFilter(
    scope
  )}${resourceFilter(scope)} AND event.type:"Warning")`;
}

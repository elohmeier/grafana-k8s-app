import { CLUSTER_FILTER, NAMESPACE_FILTER } from './compat';
import { EntityScope, joinMatchers, matcher, scopedMatchers } from './prometheus';

type AlertOptions = {
  severity?: string;
  alertname?: string;
  category?: string;
};

const DEFAULT_SEVERITY_FILTER = '${severity:regex}';
const DEFAULT_ALERTNAME_FILTER = '${alertname:regex}';
const DEFAULT_CATEGORY_FILTER = '${alertCategory:regex}';

function alertMatchers(scope: EntityScope = {}, options: AlertOptions = {}, includeAlertState = true) {
  return joinMatchers(
    scopedMatchers(scope),
    includeAlertState ? matcher('alertstate', 'firing', '=') : undefined,
    matcher('severity', options.severity ?? DEFAULT_SEVERITY_FILTER),
    matcher('alertname', options.alertname ?? DEFAULT_ALERTNAME_FILTER),
    matcher('category', options.category ?? DEFAULT_CATEGORY_FILTER)
  );
}

function alertSeries(filters: string) {
  const stateFilters = filters.replace(/(^|, )alertstate="firing"(, |$)/, (match, prefix: string, suffix: string) => {
    if (prefix && suffix) {
      return prefix;
    }

    return '';
  });

  return `
(
  ALERTS_FOR_STATE{${stateFilters}}
  or
  ALERTS{${filters}}
)
`;
}

export function alertInventoryQuery(scope: EntityScope = {}) {
  const filters = alertMatchers(scope);

  return `
count by (cluster, namespace, pod, node, workload, workload_type, alertname, severity) (
  ${alertSeries(filters)}
)
`;
}

export function globalAlertInventoryQuery() {
  const filters = alertMatchers({ cluster: CLUSTER_FILTER, namespace: NAMESPACE_FILTER });

  return `
count by (cluster, namespace, pod, node, alertname, severity) (
  ${alertSeries(filters)}
)
`;
}

export function alertCountQuery(scope: EntityScope = {}) {
  const filters = alertMatchers(scope);

  return `
count(
  ${alertSeries(filters)}
)
`;
}

export function alertsBySeverityQuery(scope: EntityScope = {}) {
  const filters = alertMatchers(scope);

  return `
count by (severity) (
  ${alertSeries(filters)}
)
`;
}

export function alertsByClusterQuery(scope: EntityScope = {}) {
  const filters = alertMatchers(scope);

  return `
count by (cluster, severity) (
  ${alertSeries(filters)}
)
`;
}

export function alertsByNamespaceQuery(scope: EntityScope = {}) {
  const filters = alertMatchers(scope);

  return `
count by (cluster, namespace, severity) (
  ${alertSeries(filters)}
)
`;
}

export function alertsByWorkloadQuery(scope: EntityScope = {}) {
  const filters = alertMatchers(scope);

  return `
count by (cluster, namespace, workload, workload_type, severity) (
  ${alertSeries(filters)}
)
`;
}

export function alertsByNodeQuery(scope: EntityScope = {}) {
  const filters = alertMatchers(scope);

  return `
count by (cluster, node, severity) (
  ${alertSeries(filters)}
)
`;
}

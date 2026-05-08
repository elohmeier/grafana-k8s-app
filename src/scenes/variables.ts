import { DataSourceVariable, QueryVariable, SceneVariableSet, type SceneVariable } from '@grafana/scenes';
import { VariableHide, VariableRefresh, VariableSort } from '@grafana/schema';
import { PROMETHEUS_REF } from '../constants';
import { getDatasourceDefaults } from '../utils/appJsonData';

type VariableControls = readonly string[] | 'all';
type BuiltInVariableName =
  | 'datasource'
  | 'elasticsearch'
  | 'infraDatasource'
  | 'cluster'
  | 'namespace'
  | 'severity'
  | 'alertname'
  | 'alertCategory';

const BUILT_IN_VARIABLES: BuiltInVariableName[] = [
  'datasource',
  'elasticsearch',
  'infraDatasource',
  'cluster',
  'namespace',
  'severity',
  'alertname',
  'alertCategory',
];

const VARIABLE_DEPENDENCIES: Partial<Record<BuiltInVariableName, BuiltInVariableName[]>> = {
  cluster: ['datasource'],
  namespace: ['datasource', 'cluster'],
  severity: ['datasource', 'cluster', 'namespace'],
  alertname: ['datasource', 'cluster', 'namespace', 'severity'],
  alertCategory: ['datasource', 'cluster', 'namespace', 'severity'],
};

function requestedVariables(controls: VariableControls) {
  return new Set(controls === 'all' ? BUILT_IN_VARIABLES : controls);
}

function expandDependencies(requested: Set<string>) {
  const included = new Set(requested);
  const addDependencies = (name: string) => {
    const dependencies = VARIABLE_DEPENDENCIES[name as BuiltInVariableName] ?? [];

    for (const dependency of dependencies) {
      if (!included.has(dependency)) {
        included.add(dependency);
        addDependencies(dependency);
      }
    }
  };

  for (const name of Array.from(requested)) {
    addDependencies(name);
  }

  return included;
}

function hideIfDependency(name: BuiltInVariableName, requested: Set<string>) {
  return requested.has(name) ? undefined : VariableHide.hideVariable;
}

export function getGlobalVariables(controls: VariableControls = 'all', extraVariables: SceneVariable[] = []) {
  const defaults = getDatasourceDefaults();
  const requested = requestedVariables(controls);
  const included = expandDependencies(requested);
  const variables: SceneVariable[] = [];

  if (included.has('datasource')) {
    variables.push(
      new DataSourceVariable({
        name: 'datasource',
        label: 'Metrics',
        pluginId: 'prometheus',
        value: defaults.prometheusUid,
        hide: hideIfDependency('datasource', requested),
      })
    );
  }

  if (included.has('elasticsearch')) {
    variables.push(
      new DataSourceVariable({
        name: 'elasticsearch',
        label: 'Logs',
        pluginId: 'elasticsearch',
        value: defaults.elasticsearchUid,
        hide: hideIfDependency('elasticsearch', requested),
      })
    );
  }

  if (included.has('infraDatasource')) {
    variables.push(
      new DataSourceVariable({
        name: 'infraDatasource',
        label: 'Infra metadata',
        pluginId: 'g42-rqlite-datasource',
        value: defaults.infraUid,
        hide: hideIfDependency('infraDatasource', requested),
      })
    );
  }

  if (included.has('cluster')) {
    variables.push(
      new QueryVariable({
        name: 'cluster',
        label: 'Cluster',
        datasource: PROMETHEUS_REF,
        query: 'label_values(kube_node_info, cluster)',
        value: '$__all',
        includeAll: true,
        isMulti: true,
        allValue: '.*',
        refresh: VariableRefresh.onDashboardLoad,
        sort: VariableSort.alphabeticalAsc,
        hide: hideIfDependency('cluster', requested),
      })
    );
  }

  if (included.has('namespace')) {
    variables.push(
      new QueryVariable({
        name: 'namespace',
        label: 'Namespace',
        datasource: PROMETHEUS_REF,
        query: 'label_values(kube_namespace_status_phase{cluster=~"${cluster:regex}"}, namespace)',
        value: '$__all',
        includeAll: true,
        isMulti: true,
        allValue: '.*',
        refresh: VariableRefresh.onDashboardLoad,
        sort: VariableSort.alphabeticalAsc,
        hide: hideIfDependency('namespace', requested),
      })
    );
  }

  if (included.has('severity')) {
    variables.push(
      new QueryVariable({
        name: 'severity',
        label: 'Severity',
        datasource: PROMETHEUS_REF,
        query: 'label_values(ALERTS{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}"}, severity)',
        value: '$__all',
        includeAll: true,
        isMulti: true,
        allValue: '.*',
        refresh: VariableRefresh.onDashboardLoad,
        sort: VariableSort.alphabeticalAsc,
        hide: hideIfDependency('severity', requested),
      })
    );
  }

  if (included.has('alertname')) {
    variables.push(
      new QueryVariable({
        name: 'alertname',
        label: 'Alert',
        datasource: PROMETHEUS_REF,
        query:
          'label_values(ALERTS{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}", severity=~"${severity:regex}"}, alertname)',
        value: '$__all',
        includeAll: true,
        isMulti: true,
        allValue: '.*',
        refresh: VariableRefresh.onDashboardLoad,
        sort: VariableSort.alphabeticalAsc,
        hide: hideIfDependency('alertname', requested),
      })
    );
  }

  if (included.has('alertCategory')) {
    variables.push(
      new QueryVariable({
        name: 'alertCategory',
        label: 'Alert category',
        datasource: PROMETHEUS_REF,
        query:
          'label_values(ALERTS{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}", severity=~"${severity:regex}"}, category)',
        value: '$__all',
        includeAll: true,
        isMulti: true,
        allValue: '.*',
        refresh: VariableRefresh.onDashboardLoad,
        sort: VariableSort.alphabeticalAsc,
        hide: hideIfDependency('alertCategory', requested),
      })
    );
  }

  return new SceneVariableSet({
    variables: [...variables, ...extraVariables],
  });
}

import { DataSourceVariable, QueryVariable, SceneVariableSet, type SceneVariable } from '@grafana/scenes';
import { VariableRefresh, VariableSort } from '@grafana/schema';
import { PROMETHEUS_REF } from '../constants';
import { getDatasourceDefaults } from '../utils/appJsonData';

export function getGlobalVariables(extraVariables: SceneVariable[] = []) {
  const defaults = getDatasourceDefaults();
  return new SceneVariableSet({
    variables: [
      new DataSourceVariable({
        name: 'datasource',
        label: 'Metrics',
        pluginId: 'prometheus',
        value: defaults.prometheusUid,
      }),
      new DataSourceVariable({
        name: 'elasticsearch',
        label: 'Logs',
        pluginId: 'elasticsearch',
        value: defaults.elasticsearchUid,
      }),
      new DataSourceVariable({
        name: 'infraDatasource',
        label: 'Infra metadata',
        pluginId: 'g42-rqlite-datasource',
        value: defaults.infraUid,
      }),
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
      }),
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
      }),
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
      }),
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
      }),
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
      }),
      ...extraVariables,
    ],
  });
}

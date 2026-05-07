import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Overview = 'overview',
  Search = 'search',
  Health = 'health',
  Clusters = 'clusters',
  Namespaces = 'namespaces',
  Workloads = 'workloads',
  Pods = 'pods',
  Nodes = 'nodes',
  PersistentVolumes = 'persistent-volumes',
  Jobs = 'jobs',
  Alerts = 'alerts',
  Platform = 'platform',
  Configuration = 'configuration',
}

export const DEFAULT_PROMETHEUS_UID = 'prometheus';
export const DEFAULT_PROMETHEUS_TECH_UID = 'prometheus-nonprod';
export const DEFAULT_ELASTICSEARCH_UID = 'elasticsearch';
export const DEFAULT_INFRA_UID = 'infra-metadata';

export const PROMETHEUS_REF = {
  type: 'prometheus',
  uid: '${datasource}',
};

export const ELASTICSEARCH_REF = {
  type: 'elasticsearch',
  uid: '${elasticsearch}',
};

export const INFRA_REF = {
  type: 'g42-rqlite-datasource',
  uid: '${infraDatasource}',
};

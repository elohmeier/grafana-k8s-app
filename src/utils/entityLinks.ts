import { DataLink } from '@grafana/data';
import { ROUTES } from '../constants';
import { prefixRoute } from './utils.routing';

const field = (name: string) => `\${__data.fields.${name}:percentencode}`;
const appState = '?\${__all_variables}&\${__url_time_range}';

const route = (base: ROUTES, ...segments: string[]) => [prefixRoute(base), ...segments].join('/');

export const clusterLink = (title = 'Open cluster', clusterField = 'cluster'): DataLink => ({
  title,
  url: `${route(ROUTES.Clusters, field(clusterField))}${appState}`,
});

export const namespaceLink = (title = 'Open namespace'): DataLink => ({
  title,
  url: `${route(ROUTES.Namespaces, field('cluster'), field('namespace'))}${appState}`,
});

export const workloadLink = (title = 'Open workload'): DataLink => ({
  title,
  url: `${route(ROUTES.Workloads, field('cluster'), field('namespace'), field('workload_type'), field('workload'))}${appState}`,
});

export const podLink = (title = 'Open pod'): DataLink => ({
  title,
  url: `${route(ROUTES.Pods, field('cluster'), field('namespace'), field('pod'))}${appState}`,
});

export const nodeLink = (title = 'Open node'): DataLink => ({
  title,
  url: `${route(ROUTES.Nodes, field('cluster'), field('node'))}${appState}`,
});

export const workloadLogsLink = (): DataLink => ({
  title: 'Open workload logs',
  url: `${route(ROUTES.Workloads, field('cluster'), field('namespace'), field('workload_type'), field('workload'))}/logs${appState}`,
});

export const podLogsLink = (): DataLink => ({
  title: 'Open pod logs',
  url: `${route(ROUTES.Pods, field('cluster'), field('namespace'), field('pod'))}/logs${appState}`,
});

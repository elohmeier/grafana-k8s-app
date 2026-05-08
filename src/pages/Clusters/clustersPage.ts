import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { clusterDetailScene } from './clusterDetailScene';
import { clustersScene } from './clustersScene';
import {
  alertsOnlyScene,
  cpuScene,
  eventsScene,
  logsScene,
  memoryScene,
  networkScene,
  resourcesScene,
  storageScene,
} from '../common/entityScenes';

const CLUSTER_PAGE_URL_KEYS = [
  'from',
  'to',
  'timezone',
  'var-datasource',
  'var-elasticsearch',
  'var-infraDatasource',
  'var-cluster',
  'var-clusterView',
  'var-severity',
  'var-alertname',
  'var-alertCategory',
];

export function getClustersPage() {
  return new SceneAppPage({
    title: 'Clusters',
    subTitle: 'Cluster capacity, health, and drilldowns',
    url: prefixRoute(ROUTES.Clusters),
    routePath: `${ROUTES.Clusters}/*`,
    preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
    getScene: clustersScene,
    drilldowns: [
      {
        routePath: ':cluster/*',
        getPage(routeMatch, parent) {
          const cluster = decodeURIComponent(routeMatch.params.cluster ?? '');
          const clusterUrl = `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}`;

          return new SceneAppPage({
            title: cluster,
            subTitle: 'Cluster detail',
            url: clusterUrl,
            routePath: ':cluster/*',
            preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
            getParentPage: () => parent,
            getScene: () => clusterDetailScene(cluster),
            tabs: [
              new SceneAppPage({
                title: 'Overview',
                url: clusterUrl,
                routePath: '/',
                preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
                getScene: () => clusterDetailScene(cluster),
              }),
              new SceneAppPage({
                title: 'CPU',
                url: `${clusterUrl}/cpu`,
                routePath: '/cpu',
                preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
                getScene: () => cpuScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Memory',
                url: `${clusterUrl}/memory`,
                routePath: '/memory',
                preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
                getScene: () => memoryScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Resources',
                url: `${clusterUrl}/resources`,
                routePath: '/resources',
                preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
                getScene: () => resourcesScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Storage',
                url: `${clusterUrl}/storage`,
                routePath: '/storage',
                preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
                getScene: () => storageScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Network',
                url: `${clusterUrl}/network`,
                routePath: '/network',
                preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
                getScene: () => networkScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Logs',
                url: `${clusterUrl}/logs`,
                routePath: '/logs',
                preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
                getScene: () => logsScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Events',
                url: `${clusterUrl}/events`,
                routePath: '/events',
                preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
                getScene: () => eventsScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Alerts',
                url: `${clusterUrl}/alerts`,
                routePath: '/alerts',
                preserveUrlKeys: CLUSTER_PAGE_URL_KEYS,
                getScene: () => alertsOnlyScene({ cluster }),
              }),
            ],
          });
        },
      },
    ],
  });
}

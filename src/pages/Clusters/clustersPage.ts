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

export function getClustersPage() {
  return new SceneAppPage({
    title: 'Clusters',
    subTitle: 'Cluster capacity, health, and drilldowns',
    url: prefixRoute(ROUTES.Clusters),
    routePath: `${ROUTES.Clusters}/*`,
    getScene: clustersScene,
    drilldowns: [
      {
        routePath: ':cluster/*',
        getPage(routeMatch, parent) {
          const cluster = decodeURIComponent(routeMatch.params.cluster ?? '');

          return new SceneAppPage({
            title: cluster,
            subTitle: 'Cluster detail',
            url: `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}`,
            routePath: ':cluster/*',
            getParentPage: () => parent,
            getScene: () => clusterDetailScene(cluster),
            tabs: [
              new SceneAppPage({
                title: 'Overview',
                url: `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}`,
                routePath: '/',
                getScene: () => clusterDetailScene(cluster),
              }),
              new SceneAppPage({
                title: 'CPU',
                url: `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}/cpu`,
                routePath: '/cpu',
                getScene: () => cpuScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Memory',
                url: `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}/memory`,
                routePath: '/memory',
                getScene: () => memoryScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Resources',
                url: `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}/resources`,
                routePath: '/resources',
                getScene: () => resourcesScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Storage',
                url: `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}/storage`,
                routePath: '/storage',
                getScene: () => storageScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Network',
                url: `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}/network`,
                routePath: '/network',
                getScene: () => networkScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Logs',
                url: `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}/logs`,
                routePath: '/logs',
                getScene: () => logsScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Events',
                url: `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}/events`,
                routePath: '/events',
                getScene: () => eventsScene({ cluster }),
              }),
              new SceneAppPage({
                title: 'Alerts',
                url: `${prefixRoute(ROUTES.Clusters)}/${encodeURIComponent(cluster)}/alerts`,
                routePath: '/alerts',
                getScene: () => alertsOnlyScene({ cluster }),
              }),
            ],
          });
        },
      },
    ],
  });
}

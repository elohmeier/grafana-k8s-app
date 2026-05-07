import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { namespaceDetailScene } from './namespaceDetailScene';
import { namespacesScene } from './namespacesScene';
import {
  alertsOnlyScene,
  cpuScene,
  eventsScene,
  logsScene,
  memoryScene,
  namespaceMetadataScene,
  networkScene,
  resourcesScene,
  storageScene,
} from '../common/entityScenes';

export function getNamespacesPage() {
  return new SceneAppPage({
    title: 'Namespaces',
    subTitle: 'Namespace resources, quotas, ownership, and drilldowns',
    url: prefixRoute(ROUTES.Namespaces),
    routePath: `${ROUTES.Namespaces}/*`,
    getScene: namespacesScene,
    drilldowns: [
      {
        routePath: ':cluster/:namespace/*',
        getPage(routeMatch, parent) {
          const cluster = decodeURIComponent(routeMatch.params.cluster ?? '');
          const namespace = decodeURIComponent(routeMatch.params.namespace ?? '');

          return new SceneAppPage({
            title: namespace,
            subTitle: cluster,
            url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}`,
            routePath: ':cluster/:namespace/*',
            getParentPage: () => parent,
            getScene: () => namespaceDetailScene(cluster, namespace),
            tabs: [
              new SceneAppPage({
                title: 'Overview',
                url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}`,
                routePath: '/',
                getScene: () => namespaceDetailScene(cluster, namespace),
              }),
              new SceneAppPage({
                title: 'CPU',
                url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/cpu`,
                routePath: '/cpu',
                getScene: () => cpuScene({ cluster, namespace }),
              }),
              new SceneAppPage({
                title: 'Memory',
                url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/memory`,
                routePath: '/memory',
                getScene: () => memoryScene({ cluster, namespace }),
              }),
              new SceneAppPage({
                title: 'Resources',
                url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/resources`,
                routePath: '/resources',
                getScene: () => resourcesScene({ cluster, namespace }),
              }),
              new SceneAppPage({
                title: 'Storage',
                url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/storage`,
                routePath: '/storage',
                getScene: () => storageScene({ cluster, namespace }),
              }),
              new SceneAppPage({
                title: 'Network',
                url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/network`,
                routePath: '/network',
                getScene: () => networkScene({ cluster, namespace }),
              }),
              new SceneAppPage({
                title: 'Logs',
                url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/logs`,
                routePath: '/logs',
                getScene: () => logsScene({ cluster, namespace }),
              }),
              new SceneAppPage({
                title: 'Events',
                url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/events`,
                routePath: '/events',
                getScene: () => eventsScene({ cluster, namespace }),
              }),
              new SceneAppPage({
                title: 'Metadata',
                url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/metadata`,
                routePath: '/metadata',
                getScene: () => namespaceMetadataScene(namespace),
              }),
              new SceneAppPage({
                title: 'Alerts',
                url: `${prefixRoute(ROUTES.Namespaces)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/alerts`,
                routePath: '/alerts',
                getScene: () => alertsOnlyScene({ cluster, namespace }),
              }),
            ],
          });
        },
      },
    ],
  });
}

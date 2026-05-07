import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { podDetailScene } from './podDetailScene';
import { podsScene } from './podsScene';
import {
  alertsOnlyScene,
  cpuScene,
  eventsScene,
  logsScene,
  memoryScene,
  namespaceMetadataScene,
  networkScene,
  storageScene,
} from '../common/entityScenes';

export function getPodsPage() {
  return new SceneAppPage({
    title: 'Pods',
    subTitle: 'Pod inventory, readiness, restarts, and drilldowns',
    url: prefixRoute(ROUTES.Pods),
    routePath: `${ROUTES.Pods}/*`,
    getScene: podsScene,
    drilldowns: [
      {
        routePath: ':cluster/:namespace/:pod/*',
        getPage(routeMatch, parent) {
          const cluster = decodeURIComponent(routeMatch.params.cluster ?? '');
          const namespace = decodeURIComponent(routeMatch.params.namespace ?? '');
          const pod = decodeURIComponent(routeMatch.params.pod ?? '');

          return new SceneAppPage({
            title: pod,
            subTitle: `${cluster} / ${namespace}`,
            url: `${prefixRoute(ROUTES.Pods)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}`,
            routePath: ':cluster/:namespace/:pod/*',
            getParentPage: () => parent,
            getScene: () => podDetailScene(cluster, namespace, pod),
            tabs: [
              new SceneAppPage({
                title: 'Overview',
                url: `${prefixRoute(ROUTES.Pods)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}`,
                routePath: '/',
                getScene: () => podDetailScene(cluster, namespace, pod),
              }),
              new SceneAppPage({
                title: 'CPU',
                url: `${prefixRoute(ROUTES.Pods)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}/cpu`,
                routePath: '/cpu',
                getScene: () => cpuScene({ cluster, namespace, pod }),
              }),
              new SceneAppPage({
                title: 'Memory',
                url: `${prefixRoute(ROUTES.Pods)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}/memory`,
                routePath: '/memory',
                getScene: () => memoryScene({ cluster, namespace, pod }),
              }),
              new SceneAppPage({
                title: 'Storage',
                url: `${prefixRoute(ROUTES.Pods)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}/storage`,
                routePath: '/storage',
                getScene: () => storageScene({ cluster, namespace, pod }),
              }),
              new SceneAppPage({
                title: 'Network',
                url: `${prefixRoute(ROUTES.Pods)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}/network`,
                routePath: '/network',
                getScene: () => networkScene({ cluster, namespace, pod }),
              }),
              new SceneAppPage({
                title: 'Logs',
                url: `${prefixRoute(ROUTES.Pods)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}/logs`,
                routePath: '/logs',
                getScene: () => logsScene({ cluster, namespace, pod }),
              }),
              new SceneAppPage({
                title: 'Events',
                url: `${prefixRoute(ROUTES.Pods)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}/events`,
                routePath: '/events',
                getScene: () => eventsScene({ cluster, namespace, pod }),
              }),
              new SceneAppPage({
                title: 'Metadata',
                url: `${prefixRoute(ROUTES.Pods)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}/metadata`,
                routePath: '/metadata',
                getScene: () => namespaceMetadataScene(namespace),
              }),
              new SceneAppPage({
                title: 'Alerts',
                url: `${prefixRoute(ROUTES.Pods)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(pod)}/alerts`,
                routePath: '/alerts',
                getScene: () => alertsOnlyScene({ cluster, namespace, pod }),
              }),
            ],
          });
        },
      },
    ],
  });
}

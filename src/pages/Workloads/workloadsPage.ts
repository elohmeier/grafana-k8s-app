import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { workloadDetailScene } from './workloadDetailScene';
import { workloadsScene } from './workloadsScene';
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

export function getWorkloadsPage() {
  return new SceneAppPage({
    title: 'Workloads',
    subTitle: 'Deployment, StatefulSet, DaemonSet, Job, and CronJob inventory',
    url: prefixRoute(ROUTES.Workloads),
    routePath: `${ROUTES.Workloads}/*`,
    getScene: workloadsScene,
    drilldowns: [
      {
        routePath: ':cluster/:namespace/:workloadType/:workload/*',
        getPage(routeMatch, parent) {
          const cluster = decodeURIComponent(routeMatch.params.cluster ?? '');
          const namespace = decodeURIComponent(routeMatch.params.namespace ?? '');
          const workloadType = decodeURIComponent(routeMatch.params.workloadType ?? '');
          const workload = decodeURIComponent(routeMatch.params.workload ?? '');

          return new SceneAppPage({
            title: workload,
            subTitle: `${cluster} / ${namespace} / ${workloadType}`,
            url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}`,
            routePath: ':cluster/:namespace/:workloadType/:workload/*',
            getParentPage: () => parent,
            getScene: () => workloadDetailScene(cluster, namespace, workloadType, workload),
            tabs: [
              new SceneAppPage({
                title: 'Overview',
                url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}`,
                routePath: '/',
                getScene: () => workloadDetailScene(cluster, namespace, workloadType, workload),
              }),
              new SceneAppPage({
                title: 'CPU',
                url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}/cpu`,
                routePath: '/cpu',
                getScene: () => cpuScene({ cluster, namespace, workload, workloadType }),
              }),
              new SceneAppPage({
                title: 'Memory',
                url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}/memory`,
                routePath: '/memory',
                getScene: () => memoryScene({ cluster, namespace, workload, workloadType }),
              }),
              new SceneAppPage({
                title: 'Resources',
                url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}/resources`,
                routePath: '/resources',
                getScene: () => resourcesScene({ cluster, namespace, workload, workloadType }),
              }),
              new SceneAppPage({
                title: 'Storage',
                url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}/storage`,
                routePath: '/storage',
                getScene: () => storageScene({ cluster, namespace, workload, workloadType }),
              }),
              new SceneAppPage({
                title: 'Network',
                url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}/network`,
                routePath: '/network',
                getScene: () => networkScene({ cluster, namespace, workload, workloadType }),
              }),
              new SceneAppPage({
                title: 'Logs',
                url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}/logs`,
                routePath: '/logs',
                getScene: () => logsScene({ cluster, namespace, workload, workloadType }),
              }),
              new SceneAppPage({
                title: 'Events',
                url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}/events`,
                routePath: '/events',
                getScene: () => eventsScene({ cluster, namespace, workload, workloadType }),
              }),
              new SceneAppPage({
                title: 'Metadata',
                url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}/metadata`,
                routePath: '/metadata',
                getScene: () => namespaceMetadataScene(namespace),
              }),
              new SceneAppPage({
                title: 'Alerts',
                url: `${prefixRoute(ROUTES.Workloads)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/${encodeURIComponent(workloadType)}/${encodeURIComponent(workload)}/alerts`,
                routePath: '/alerts',
                getScene: () => alertsOnlyScene({ cluster, namespace, workload, workloadType }),
              }),
            ],
          });
        },
      },
    ],
  });
}

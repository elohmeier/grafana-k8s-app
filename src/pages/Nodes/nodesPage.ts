import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { nodeDetailScene } from './nodeDetailScene';
import { nodesScene } from './nodesScene';
import { alertsOnlyScene, cpuScene, memoryScene, networkScene, nodeRuntimeScene } from '../common/entityScenes';

export const nodesPage = new SceneAppPage({
  title: 'Nodes',
  subTitle: 'Node inventory, conditions, and resource usage',
  url: prefixRoute(ROUTES.Nodes),
  routePath: `${ROUTES.Nodes}/*`,
  getScene: nodesScene,
  drilldowns: [
    {
      routePath: ':cluster/:node/*',
      getPage(routeMatch, parent) {
        const cluster = decodeURIComponent(routeMatch.params.cluster ?? '');
        const node = decodeURIComponent(routeMatch.params.node ?? '');

        return new SceneAppPage({
          title: node,
          subTitle: cluster,
          url: `${prefixRoute(ROUTES.Nodes)}/${encodeURIComponent(cluster)}/${encodeURIComponent(node)}`,
          routePath: ':cluster/:node/*',
          getParentPage: () => parent,
          getScene: () => nodeDetailScene(cluster, node),
          tabs: [
            new SceneAppPage({
              title: 'Overview',
              url: `${prefixRoute(ROUTES.Nodes)}/${encodeURIComponent(cluster)}/${encodeURIComponent(node)}`,
              routePath: '/',
              getScene: () => nodeDetailScene(cluster, node),
            }),
            new SceneAppPage({
              title: 'CPU',
              url: `${prefixRoute(ROUTES.Nodes)}/${encodeURIComponent(cluster)}/${encodeURIComponent(node)}/cpu`,
              routePath: '/cpu',
              getScene: () => cpuScene({ cluster, node }),
            }),
            new SceneAppPage({
              title: 'Memory',
              url: `${prefixRoute(ROUTES.Nodes)}/${encodeURIComponent(cluster)}/${encodeURIComponent(node)}/memory`,
              routePath: '/memory',
              getScene: () => memoryScene({ cluster, node }),
            }),
            new SceneAppPage({
              title: 'Runtime',
              url: `${prefixRoute(ROUTES.Nodes)}/${encodeURIComponent(cluster)}/${encodeURIComponent(node)}/runtime`,
              routePath: '/runtime',
              getScene: () => nodeRuntimeScene({ cluster, node }),
            }),
            new SceneAppPage({
              title: 'Network',
              url: `${prefixRoute(ROUTES.Nodes)}/${encodeURIComponent(cluster)}/${encodeURIComponent(node)}/network`,
              routePath: '/network',
              getScene: () => networkScene({ cluster, node }),
            }),
            new SceneAppPage({
              title: 'Alerts',
              url: `${prefixRoute(ROUTES.Nodes)}/${encodeURIComponent(cluster)}/${encodeURIComponent(node)}/alerts`,
              routePath: '/alerts',
              getScene: () => alertsOnlyScene({ cluster, node }),
            }),
          ],
        });
      },
    },
  ],
});

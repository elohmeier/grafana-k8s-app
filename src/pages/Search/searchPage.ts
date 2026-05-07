import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { searchScene } from './searchScene';

export const searchPage = new SceneAppPage({
  title: 'Search',
  subTitle: 'Find clusters, namespaces, workloads, pods, containers, and nodes',
  url: prefixRoute(ROUTES.Search),
  routePath: ROUTES.Search,
  getScene: searchScene,
});

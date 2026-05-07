import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { overviewScene } from './overviewScene';

export function getOverviewPage() {
  return new SceneAppPage({
    title: 'Kubernetes Overview',
    subTitle: 'Enterprise Kubernetes/OpenShift observability entry point',
    url: prefixRoute(ROUTES.Overview),
    routePath: ROUTES.Overview,
    getScene: overviewScene,
  });
}

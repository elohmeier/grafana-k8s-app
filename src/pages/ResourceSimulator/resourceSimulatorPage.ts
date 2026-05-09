import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { resourceSimulatorScene } from './resourceSimulatorScene';

export function getResourceSimulatorPage() {
  return new SceneAppPage({
    title: 'Resource Simulator',
    subTitle: 'Namespace quota and capacity what-if modeling',
    url: prefixRoute(ROUTES.ResourceSimulator),
    routePath: ROUTES.ResourceSimulator,
    getScene: resourceSimulatorScene,
  });
}

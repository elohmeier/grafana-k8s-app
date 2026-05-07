import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { healthScene } from './healthScene';

export const healthPage = new SceneAppPage({
  title: 'Health',
  subTitle: 'Current Kubernetes/OpenShift problems from Prometheus/Thanos',
  url: prefixRoute(ROUTES.Health),
  routePath: ROUTES.Health,
  getScene: healthScene,
});

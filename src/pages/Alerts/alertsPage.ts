import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { alertsScene } from './alertsScene';

export function getAlertsPage() {
  return new SceneAppPage({
    title: 'Alerts',
    subTitle: 'Kubernetes/OpenShift alert explorer',
    url: prefixRoute(ROUTES.Alerts),
    routePath: ROUTES.Alerts,
    getScene: alertsScene,
  });
}

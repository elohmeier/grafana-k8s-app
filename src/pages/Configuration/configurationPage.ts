import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { configurationScene } from './configurationScene';
import { metricsStatusScene } from './metricsStatusScene';

export function getConfigurationPage() {
  return new SceneAppPage({
    title: 'Configuration',
    subTitle: 'Datasource and telemetry readiness',
    url: prefixRoute(ROUTES.Configuration),
    routePath: `${ROUTES.Configuration}/*`,
    getScene: configurationScene,
    tabs: [
      new SceneAppPage({
        title: 'Datasource contract',
        url: prefixRoute(ROUTES.Configuration),
        routePath: '/',
        getScene: configurationScene,
      }),
      new SceneAppPage({
        title: 'Metrics status',
        url: `${prefixRoute(ROUTES.Configuration)}/metrics-status`,
        routePath: '/metrics-status',
        getScene: metricsStatusScene,
      }),
    ],
  });
}

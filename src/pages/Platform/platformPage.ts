import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { platformNetworkingScene } from './platformNetworkingScene';
import { platformScene } from './platformScene';

export const platformPage = new SceneAppPage({
  title: 'Platform Operations',
  subTitle: 'Specialist Kubernetes/OpenShift platform views',
  url: prefixRoute(ROUTES.Platform),
  routePath: `${ROUTES.Platform}/*`,
  getScene: platformScene,
  tabs: [
    new SceneAppPage({
      title: 'Overview',
      url: prefixRoute(ROUTES.Platform),
      routePath: '/',
      getScene: platformScene,
    }),
    new SceneAppPage({
      title: 'Networking / OVN',
      url: `${prefixRoute(ROUTES.Platform)}/networking`,
      routePath: '/networking',
      getScene: platformNetworkingScene,
    }),
  ],
});

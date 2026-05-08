import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { platformControlPlaneScene } from './platformControlPlaneScene';
import { platformIngressScene } from './platformIngressScene';
import { platformNetworkingScene } from './platformNetworkingScene';
import { platformObservabilityScene } from './platformObservabilityScene';
import { platformOperatorsScene } from './platformOperatorsScene';
import { platformScene } from './platformScene';

export function getPlatformPage() {
  return new SceneAppPage({
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
        title: 'Control Plane / etcd',
        url: `${prefixRoute(ROUTES.Platform)}/control-plane`,
        routePath: '/control-plane',
        getScene: platformControlPlaneScene,
      }),
      new SceneAppPage({
        title: 'Networking / OVN',
        url: `${prefixRoute(ROUTES.Platform)}/networking`,
        routePath: '/networking',
        getScene: platformNetworkingScene,
      }),
      new SceneAppPage({
        title: 'Ingress / AKO / AVI',
        url: `${prefixRoute(ROUTES.Platform)}/ingress`,
        routePath: '/ingress',
        getScene: platformIngressScene,
      }),
      new SceneAppPage({
        title: 'Operators / Add-ons',
        url: `${prefixRoute(ROUTES.Platform)}/operators`,
        routePath: '/operators',
        getScene: platformOperatorsScene,
      }),
      new SceneAppPage({
        title: 'Observability Pipeline',
        url: `${prefixRoute(ROUTES.Platform)}/observability`,
        routePath: '/observability',
        getScene: platformObservabilityScene,
      }),
    ],
  });
}

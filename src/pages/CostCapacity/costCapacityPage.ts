import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { costCapacityScene } from './costCapacityScene';

export function getCostCapacityPage() {
  return new SceneAppPage({
    title: 'Cost & Capacity',
    subTitle: 'Cluster allocation, saturation, and optional OpenCost estimates',
    url: prefixRoute(ROUTES.CostCapacity),
    routePath: ROUTES.CostCapacity,
    getScene: costCapacityScene,
  });
}

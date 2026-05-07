import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { persistentVolumesScene } from './persistentVolumesScene';

export function getPersistentVolumesPage() {
  return new SceneAppPage({
    title: 'Persistent Volumes',
    subTitle: 'PV/PVC inventory, fill level, and risk buckets',
    url: prefixRoute(ROUTES.PersistentVolumes),
    routePath: ROUTES.PersistentVolumes,
    getScene: persistentVolumesScene,
  });
}

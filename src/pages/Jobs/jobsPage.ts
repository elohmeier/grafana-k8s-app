import { SceneAppPage } from '@grafana/scenes';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { jobsScene } from './jobsScene';

export const jobsPage = new SceneAppPage({
  title: 'Jobs',
  subTitle: 'Jobs, CronJobs, and cluster test status',
  url: prefixRoute(ROUTES.Jobs),
  routePath: ROUTES.Jobs,
  getScene: jobsScene,
});

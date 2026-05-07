import { full, item, pageScene, row } from '../../scenes/common';
import { tablePanel, warningStatPanel } from '../../scenes/panels';
import { cronJobsInventoryQuery, jobsInventoryQuery } from '../../queries/jobs';

export function jobsScene() {
  return pageScene([
    row(
      [
        item(
          warningStatPanel(
            'Failed jobs',
            'count(kube_job_status_failed{cluster=~"${cluster:regex}", namespace=~"${namespace:regex}"} > 0)'
          ),
          '33%',
          150
        ),
        item(tablePanel('CronJobs', cronJobsInventoryQuery()), '67%', 240),
      ],
      260
    ),
    full(tablePanel('Jobs', jobsInventoryQuery()), 360),
  ]);
}

import { full, item, pageScene, row } from '../../scenes/common';
import { tablePanel, warningStatPanel } from '../../scenes/panels';
import { alertCountQuery, alertsByClusterQuery, alertsBySeverityQuery, globalAlertInventoryQuery } from '../../queries/alerts';

export function alertsScene() {
  return pageScene([
    row(
      [
        item(
          warningStatPanel('Firing alerts', alertCountQuery()),
          '25%',
          150
        ),
        item(
          tablePanel('Alerts by severity', alertsBySeverityQuery()),
          '25%',
          180
        ),
        item(
          tablePanel('Alerts by cluster', alertsByClusterQuery()),
          '50%',
          180
        ),
      ],
      220
    ),
    full(tablePanel('Firing Kubernetes alerts', globalAlertInventoryQuery()), 420),
  ]);
}

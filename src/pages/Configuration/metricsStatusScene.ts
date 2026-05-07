import { full, pageScene } from '../../scenes/common';
import { tablePanel, textPanel } from '../../scenes/panels';
import { metricsCapabilityQuery } from '../../queries/capabilities';

export function metricsStatusScene() {
  return pageScene([
    full(
      textPanel(
        'Metrics status',
        [
          'Capability probes show which upstream-style Kubernetes Monitoring feature groups are available in the selected Thanos datasource.',
          '',
          'A value of 1 means at least one matching series exists for the current cluster filter; 0 means the app should hide or degrade that feature group.',
        ].join('\n')
      ),
      160
    ),
    full(tablePanel('Capability probes', metricsCapabilityQuery()), 420),
  ]);
}

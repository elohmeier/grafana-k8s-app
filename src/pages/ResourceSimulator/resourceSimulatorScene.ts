import { full, NAMESPACE_CONTROLS, pageScene } from '../../scenes/common';
import { ResourceSimulatorObject } from './ResourceSimulatorObject';

export function resourceSimulatorScene() {
  return pageScene([full(new ResourceSimulatorObject(), 760)], 'now-15m', [], NAMESPACE_CONTROLS, {
    includeComparison: false,
    includeTimePicker: false,
    variableOptions: {
      singleSelectVariables: ['cluster', 'namespace'],
    },
  });
}

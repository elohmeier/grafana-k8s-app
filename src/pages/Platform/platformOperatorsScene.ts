import { CLUSTER_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { tablePanel, timeseriesPanel, warningStatPanel } from '../../scenes/panels';
import {
  argocdApplicationsByStatus,
  argocdSyncFailures,
  certificatesExpiringSoon,
  certificatesNotReady,
  kedaScaledObjectErrors,
  kyvernoPolicyFailures,
  tridentVolumeRisks,
} from '../../queries/platformOperators';

export function platformOperatorsScene() {
  return pageScene(
    [
      row(
        [
          item(warningStatPanel('Certificates not ready', `count(${certificatesNotReady().trim()})`), '33%', 150),
          item(warningStatPanel('Certificates expiring soon', `count(${certificatesExpiringSoon().trim()})`), '33%', 150),
          item(warningStatPanel('Trident/PVC risks', `count(${tridentVolumeRisks().trim()})`), '34%', 150),
        ],
        180
      ),
      row(
        [
          item(tablePanel('ArgoCD applications by status', argocdApplicationsByStatus()), '50%', 300),
          item(timeseriesPanel('ArgoCD sync failures', argocdSyncFailures(), 'ops'), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(timeseriesPanel('KEDA scaler errors', kedaScaledObjectErrors(), 'ops'), '50%', 300),
          item(tablePanel('Kyverno policy failures over range', kyvernoPolicyFailures()), '50%', 300),
        ],
        320
      ),
      row(
        [
          item(tablePanel('Certificates not ready', certificatesNotReady()), '50%', 300),
          item(tablePanel('Trident/PVC risks', tridentVolumeRisks()), '50%', 300),
        ],
        320
      ),
      full(tablePanel('Certificates expiring soon', certificatesExpiringSoon()), 300),
    ],
    'now-1h',
    [],
    CLUSTER_CONTROLS
  );
}

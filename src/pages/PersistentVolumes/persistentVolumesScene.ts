import { full, item, pageScene, row } from '../../scenes/common';
import { ratioTimeseriesPanel, tablePanel, warningStatPanel } from '../../scenes/panels';
import { persistentVolumeInventoryQuery, persistentVolumeRiskQuery, persistentVolumeUsageQuery } from '../../queries/storage';

export function persistentVolumesScene() {
  return pageScene([
    row(
      [
        item(warningStatPanel('PVCs near full or unhealthy', `count(${persistentVolumeRiskQuery()})`), '33%', 150),
        item(tablePanel('PV/PVC inventory', persistentVolumeInventoryQuery()), '67%', 220),
      ],
      240
    ),
    full(ratioTimeseriesPanel('PVC used ratio', persistentVolumeUsageQuery()), 320),
    full(tablePanel('PV/PVC risks', persistentVolumeRiskQuery()), 320),
  ]);
}

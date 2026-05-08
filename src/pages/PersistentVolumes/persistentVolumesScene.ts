import { full, item, pageScene, row } from '../../scenes/common';
import { ratioTimeseriesPanel, tablePanel, topTablePanel, warningStatPanel } from '../../scenes/panels';
import {
  persistentVolumeInventoryQuery,
  persistentVolumeRiskQuery,
  topPersistentVolumeUsageQuery,
  topPersistentVolumeUsageTrend,
} from '../../queries/storage';

export function persistentVolumesScene() {
  return pageScene([
    row(
      [
        item(warningStatPanel('PVCs near full or unhealthy', `count(${persistentVolumeRiskQuery()})`), '33%', 150),
        item(tablePanel('PV/PVC inventory', persistentVolumeInventoryQuery()), '67%', 220),
      ],
      240
    ),
    row(
      [
        item(ratioTimeseriesPanel('Top PVC used ratio', topPersistentVolumeUsageTrend()), '50%', 320),
        item(topTablePanel('Top PVCs by used ratio', topPersistentVolumeUsageQuery(), 'percentunit'), '50%', 320),
      ],
      340
    ),
    full(tablePanel('PV/PVC risks', persistentVolumeRiskQuery()), 320),
  ]);
}

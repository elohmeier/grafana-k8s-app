import { PanelBuilders } from '@grafana/scenes';
import {
  clusterCpuCapacity,
  clusterIdleCpuRequests,
  clusterIdleMemoryBytes,
  clusterMemoryCapacity,
  currentMonthlyClusterCost,
  projectedMonthlyClusterCost,
} from '../../queries/costCapacity';
import { clusterInventoryQuery } from '../../queries/entity';
import { nodesNotReadyByCluster, podsNotReadyByCluster } from '../../queries/health';
import { clusterCpuUsage, clusterMemoryWorkingSet, firingAlerts } from '../../queries/prometheus';
import { joinedPrometheusTableData, percentThresholds, type PromTableQuery } from '../../scenes/panels';
import { clusterLink } from '../../utils/entityLinks';

function overRange(functionName: 'avg_over_time' | 'max_over_time', expr: string) {
  return `${functionName}((${expr.trim()})[$__range:])`;
}

function usageToCapacity(usageExpr: string, capacityExpr: string) {
  return `
(${usageExpr.trim()})
/
(${capacityExpr.trim()} > 0)
`;
}

function usageQueries(): PromTableQuery[] {
  const cpuUsage = clusterCpuUsage();
  const memoryUsage = clusterMemoryWorkingSet();

  return [
    { refId: 'nodes', expr: clusterInventoryQuery(), legendFormat: 'Nodes' },
    { refId: 'alerts', expr: `sum by (cluster) (${firingAlerts().trim()})`, legendFormat: 'Alerts' },
    { refId: 'nodesNotReady', expr: nodesNotReadyByCluster(), legendFormat: 'Not ready nodes' },
    { refId: 'podsNotReady', expr: podsNotReadyByCluster(), legendFormat: 'Not ready pods' },
    { refId: 'cpuAvg', expr: overRange('avg_over_time', cpuUsage), legendFormat: 'CPU avg' },
    { refId: 'cpuMax', expr: overRange('max_over_time', cpuUsage), legendFormat: 'CPU max' },
    {
      refId: 'cpuPercent',
      expr: overRange('max_over_time', usageToCapacity(cpuUsage, clusterCpuCapacity())),
      legendFormat: 'CPU %',
    },
    { refId: 'memoryAvg', expr: overRange('avg_over_time', memoryUsage), legendFormat: 'Memory avg' },
    { refId: 'memoryMax', expr: overRange('max_over_time', memoryUsage), legendFormat: 'Memory max' },
    {
      refId: 'memoryPercent',
      expr: overRange('max_over_time', usageToCapacity(memoryUsage, clusterMemoryCapacity())),
      legendFormat: 'Memory %',
    },
  ];
}

function costQueries(): PromTableQuery[] {
  return [
    { refId: 'currentCost', expr: currentMonthlyClusterCost(), legendFormat: 'Current 30d compute' },
    { refId: 'projectedCost', expr: projectedMonthlyClusterCost(), legendFormat: 'Projected 30d compute' },
    { refId: 'idleCpu', expr: clusterIdleCpuRequests(), legendFormat: 'Idle CPU requests' },
    { refId: 'idleMemory', expr: clusterIdleMemoryBytes(), legendFormat: 'Idle memory requests' },
  ];
}

export function clusterUsageInventoryPanel() {
  return PanelBuilders.table()
    .setTitle('Cluster usage inventory')
    .setData(
      joinedPrometheusTableData(usageQueries(), {
        cluster: 'Cluster',
        provider_id: 'Provider',
      })
    )
    .setNoValue('-')
    .setFilterable(true)
    .setOverrides((builder) => {
      builder.matchFieldsWithName('Cluster').overrideLinks([clusterLink('Open cluster', 'Cluster')]);
      builder
        .matchFieldsWithNameByRegex('^(Nodes|Alerts|Not ready nodes|Not ready pods)$')
        .overrideUnit('short')
        .overrideDecimals(0);
      builder.matchFieldsWithNameByRegex('^CPU (avg|max)$').overrideUnit('cores').overrideDecimals(2);
      builder.matchFieldsWithNameByRegex('^Memory (avg|max)$').overrideUnit('bytes').overrideDecimals(1);
      builder
        .matchFieldsWithNameByRegex('^(CPU|Memory) %$')
        .overrideUnit('percentunit')
        .overrideDecimals(1)
        .overrideMin(0)
        .overrideMax(1)
        .overrideThresholds(percentThresholds());
    })
    .build();
}

export function clusterCostInventoryPanel() {
  return PanelBuilders.table()
    .setTitle('Cluster cost inventory')
    .setData(
      joinedPrometheusTableData(costQueries(), {
        cluster: 'Cluster',
      })
    )
    .setNoValue('-')
    .setFilterable(true)
    .setOverrides((builder) => {
      builder.matchFieldsWithName('Cluster').overrideLinks([clusterLink('Open cluster', 'Cluster')]);
      builder
        .matchFieldsWithNameByRegex('^(Current|Projected) 30d compute$')
        .overrideUnit('currencyUSD')
        .overrideDecimals(2);
      builder.matchFieldsWithName('Idle CPU requests').overrideUnit('cores').overrideDecimals(2);
      builder.matchFieldsWithName('Idle memory requests').overrideUnit('bytes').overrideDecimals(1);
    })
    .build();
}

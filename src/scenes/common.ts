import {
  EmbeddedScene,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneTimeRangeCompare,
  type SceneVariable,
  VariableValueControl,
  VariableValueSelectors,
} from '@grafana/scenes';
import { getGlobalVariables } from './variables';

export const METRICS_CONTROLS = ['datasource'] as const;
export const CLUSTER_CONTROLS = ['datasource', 'cluster'] as const;
export const NAMESPACE_CONTROLS = ['datasource', 'cluster', 'namespace'] as const;
export const SEARCH_CONTROLS = ['datasource', 'search'] as const;
export const LOG_CONTROLS = ['elasticsearch'] as const;
export const METADATA_CONTROLS = ['infraDatasource'] as const;
export const ALERT_FILTER_CONTROLS = ['severity', 'alertname', 'alertCategory'] as const;
export const CLUSTER_ALERT_CONTROLS = ['datasource', 'cluster', ...ALERT_FILTER_CONTROLS] as const;
export const GLOBAL_ALERT_CONTROLS = ['datasource', 'cluster', 'namespace', ...ALERT_FILTER_CONTROLS] as const;
export const DETAIL_ALERT_CONTROLS = ['datasource', ...ALERT_FILTER_CONTROLS] as const;

type VariableControls = readonly string[] | 'all';

function variableControls(controls: VariableControls) {
  if (controls === 'all') {
    return [new VariableValueSelectors({})];
  }

  return controls.map((variableName) => new VariableValueControl({ variableName }));
}

export function pageScene(
  children: SceneFlexItem[],
  from = 'now-1h',
  extraVariables: SceneVariable[] = [],
  controls: VariableControls = NAMESPACE_CONTROLS
) {
  return new EmbeddedScene({
    $timeRange: new SceneTimeRange({
      from,
      to: 'now',
      refreshOnActivate: { afterMs: 60_000 },
    }),
    $variables: getGlobalVariables(extraVariables),
    controls: [
      ...variableControls(controls),
      new SceneTimeRangeCompare({
        hideCheckbox: true,
      }),
      new SceneTimePicker({ isOnCanvas: true }),
      new SceneRefreshPicker({}),
    ],
    body: new SceneFlexLayout({
      direction: 'column',
      children,
    }),
  });
}

export function row(children: SceneFlexItem[], minHeight = 180) {
  return new SceneFlexItem({
    minHeight,
    body: new SceneFlexLayout({
      direction: 'row',
      minHeight,
      children,
    }),
  });
}

export function item(body: SceneFlexItem['state']['body'], width = '50%', minHeight = 260) {
  return new SceneFlexItem({
    width,
    minHeight,
    body,
  });
}

export function full(body: SceneFlexItem['state']['body'], minHeight = 320) {
  return new SceneFlexItem({
    minHeight,
    body,
  });
}

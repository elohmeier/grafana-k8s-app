import {
  EmbeddedScene,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneTimeRangeCompare,
  type SceneVariable,
  VariableValueSelectors,
} from '@grafana/scenes';
import { getGlobalVariables } from './variables';

export function pageScene(children: SceneFlexItem[], from = 'now-1h', extraVariables: SceneVariable[] = []) {
  return new EmbeddedScene({
    $timeRange: new SceneTimeRange({
      from,
      to: 'now',
      refreshOnActivate: { afterMs: 60_000 },
    }),
    $variables: getGlobalVariables(extraVariables),
    controls: [
      new VariableValueSelectors({}),
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

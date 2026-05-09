import { QueryVariable, SceneTimeRangeCompare } from '@grafana/scenes';
import { NAMESPACE_CONTROLS, pageScene } from './common';
import { getGlobalVariables } from './variables';

function queryVariable(name: string, variables = getGlobalVariables(NAMESPACE_CONTROLS)) {
  const variable = variables.state.variables.find((candidate) => candidate.state.name === name);

  if (!(variable instanceof QueryVariable)) {
    throw new Error(`Expected ${name} to be a QueryVariable`);
  }

  return variable;
}

function hasComparisonControl(scene: ReturnType<typeof pageScene>) {
  return scene.state.controls?.some((control) => control instanceof SceneTimeRangeCompare) ?? false;
}

describe('global scene variables', () => {
  it('keeps namespace controls multi-select by default', () => {
    const cluster = queryVariable('cluster');
    const namespace = queryVariable('namespace');

    expect(cluster.state).toMatchObject({
      value: '$__all',
      includeAll: true,
      isMulti: true,
      allValue: '.*',
    });
    expect(namespace.state).toMatchObject({
      value: '$__all',
      includeAll: true,
      isMulti: true,
      allValue: '.*',
    });
  });

  it('can make cluster and namespace single-select for scoped pages', () => {
    const variables = getGlobalVariables(NAMESPACE_CONTROLS, [], {
      singleSelectVariables: ['cluster', 'namespace'],
    });
    const cluster = queryVariable('cluster', variables);
    const namespace = queryVariable('namespace', variables);

    expect(cluster.state).toMatchObject({
      value: '',
      text: '',
      includeAll: false,
      isMulti: false,
    });
    expect(namespace.state).toMatchObject({
      value: '',
      text: '',
      includeAll: false,
      isMulti: false,
    });
    expect(cluster.state.allValue).toBeUndefined();
    expect(namespace.state.allValue).toBeUndefined();
  });
});

describe('page scene controls', () => {
  it('can omit the time comparison control', () => {
    const scene = pageScene([], 'now-15m', [], NAMESPACE_CONTROLS, { includeComparison: false });

    expect(hasComparisonControl(scene)).toBe(false);
  });

  it('includes the time comparison control by default', () => {
    const scene = pageScene([], 'now-15m', [], NAMESPACE_CONTROLS);

    expect(hasComparisonControl(scene)).toBe(true);
  });
});

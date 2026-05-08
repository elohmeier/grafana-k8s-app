import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';

import { nodeMemoryUtilization } from '../queries/node';
import { clusterCpuUsage, nodeConditions } from '../queries/prometheus';
import { legendFromPromQuery, linkedTablePanel, nodeGraphPanel, prometheusTableData, tablePanel, timeseriesPanel } from './panels';

function panelQuery(panel: ReturnType<typeof tablePanel>) {
  const data = panel.state.$data;
  const runner = data instanceof SceneDataTransformer ? data.state.$data : data;

  return ((runner as SceneQueryRunner).state.queries[0] ?? {}) as Record<string, unknown>;
}

describe('panel query construction', () => {
  it('uses Prometheus table format for plain and linked table panels', () => {
    const plainTableQuery = panelQuery(tablePanel('Node conditions', nodeConditions()));
    const linkedTableQuery = panelQuery(linkedTablePanel('Node conditions', nodeConditions(), []));

    expect(plainTableQuery).toMatchObject({
      format: 'table',
      instant: true,
      legendFormat: '',
      range: false,
      refId: 'A',
      timeRangeCompare: false,
    });
    expect(linkedTableQuery).toMatchObject({
      format: 'table',
      instant: true,
      legendFormat: '',
    });
  });

  it('hides the Prometheus timestamp field from generated table panels', () => {
    const data = prometheusTableData(nodeConditions()) as SceneDataTransformer;

    expect(data.state.transformations).toContainEqual({
      id: 'organize',
      options: {
        excludeByName: {
          Time: true,
        },
        renameByName: {
          Value: 'value',
        },
      },
    });
  });

  it('uses explicit compact legends for time series panels', () => {
    const query = panelQuery(timeseriesPanel('CPU usage by cluster', clusterCpuUsage(), 'cores'));

    expect(query).toMatchObject({
      format: 'time_series',
      instant: false,
      legendFormat: '{{cluster}}',
      range: true,
    });
  });

  it('derives legends from aggregate labels and selector labels', () => {
    expect(legendFromPromQuery(clusterCpuUsage())).toBe('{{cluster}}');
    expect(legendFromPromQuery(nodeMemoryUtilization())).toBe('{{cluster}} / {{node}}');
  });

  it('builds node graph panels from Prometheus table node and edge queries', () => {
    const panel = nodeGraphPanel('Topology', 'nodes_expr', 'edges_expr');
    const runner = panel.state.$data as SceneQueryRunner;

    expect(runner.state.queries).toMatchObject([
      {
        refId: 'nodes',
        expr: 'nodes_expr',
        format: 'table',
        instant: true,
        range: false,
      },
      {
        refId: 'edges',
        expr: 'edges_expr',
        format: 'table',
        instant: true,
        range: false,
      },
    ]);
  });
});

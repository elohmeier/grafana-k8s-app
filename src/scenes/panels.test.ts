import { SceneQueryRunner } from '@grafana/scenes';

import { nodeMemoryUtilization } from '../queries/node';
import { clusterCpuUsage, nodeConditions } from '../queries/prometheus';
import { legendFromPromQuery, linkedTablePanel, tablePanel, timeseriesPanel } from './panels';

function panelQuery(panel: ReturnType<typeof tablePanel>) {
  return ((panel.state.$data as SceneQueryRunner).state.queries[0] ?? {}) as Record<string, unknown>;
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
});

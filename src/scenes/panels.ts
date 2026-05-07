import { DataLink, FieldColorModeId, ThresholdsMode } from '@grafana/data';
import { PanelBuilders, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { elasticsearchDatasource, infraDatasource, prometheusDatasource } from '../queries/datasources';

type PromRunnerOptions = {
  instant?: boolean;
  timeRangeCompare?: boolean;
};

export function promRunner(expr: string, refId = 'A', options: PromRunnerOptions = {}) {
  const instant = options.instant ?? false;

  return new SceneQueryRunner({
    datasource: prometheusDatasource(),
    queries: [
      {
        refId,
        expr,
        instant,
        range: !instant,
        timeRangeCompare: options.timeRangeCompare,
      },
    ],
    maxDataPoints: 800,
    minInterval: '30s',
  });
}

export function datasourceRunner(datasource: DataSourceRef, query: Record<string, unknown>, refId = 'A') {
  return new SceneQueryRunner({
    datasource,
    queries: [
      {
        refId,
        ...query,
      },
    ],
    maxDataPoints: 800,
    minInterval: '30s',
  });
}

export function statPanel(title: string, expr: string) {
  return PanelBuilders.stat()
    .setTitle(title)
    .setData(promRunner(expr, 'A', { instant: true, timeRangeCompare: false }))
    .setNoValue('-')
    .setColor({ mode: FieldColorModeId.PaletteClassic })
    .build();
}

export function tablePanel(title: string, expr: string) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(promRunner(expr, 'A', { instant: true, timeRangeCompare: false }))
    .setNoValue('-')
    .build();
}

export function linkedTablePanel(title: string, expr: string, links: DataLink[]) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(promRunner(expr, 'A', { instant: true, timeRangeCompare: false }))
    .setNoValue('-')
    .setLinks(links)
    .build();
}

export function elasticsearchTablePanel(title: string, query: string) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(
      datasourceRunner(elasticsearchDatasource(), {
        query,
        metrics: [{ type: 'logs', id: '1', settings: { limit: '500' } }],
        bucketAggs: [],
        timeField: '@timestamp',
        queryType: 'lucene',
      })
    )
    .setNoValue('-')
    .build();
}

export function infraTablePanel(title: string, rawSql: string) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(
      datasourceRunner(infraDatasource(), {
        rawSql,
        query: rawSql,
        format: 'table',
        editorMode: 'code',
      })
    )
    .setNoValue('-')
    .build();
}

export function timeseriesPanel(title: string, expr: string, unit?: string) {
  let builder = PanelBuilders.timeseries()
    .setTitle(title)
    .setData(promRunner(expr))
    .setNoValue('-')
    .setColor({ mode: FieldColorModeId.PaletteClassic });

  if (unit) {
    builder = builder.setUnit(unit);
  }

  return builder.build();
}

export function warningStatPanel(title: string, expr: string) {
  return PanelBuilders.stat()
    .setTitle(title)
    .setData(promRunner(expr, 'A', { instant: true, timeRangeCompare: false }))
    .setNoValue('0')
    .setThresholds({
      mode: ThresholdsMode.Absolute,
      steps: [
        { color: 'green', value: -Infinity },
        { color: 'red', value: 1 },
      ],
    })
    .build();
}

export function textPanel(title: string, content: string) {
  return PanelBuilders.text()
    .setTitle(title)
    .setOption('content', content)
    .setOption('mode', 'markdown' as never)
    .build();
}

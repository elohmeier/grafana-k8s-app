import { DataLink, FieldColorModeId, ThresholdsMode } from '@grafana/data';
import { PanelBuilders, SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { elasticsearchDatasource, infraDatasource, prometheusDatasource } from '../queries/datasources';

type PromRunnerOptions = {
  format?: 'time_series' | 'table';
  instant?: boolean;
  legendFormat?: string;
  timeRangeCompare?: boolean;
};

export type PromTableQuery = {
  refId: string;
  expr: string;
  legendFormat: string;
};

type ThresholdStep = {
  color: string;
  value: number;
};

export function promRunner(expr: string, refId = 'A', options: PromRunnerOptions = {}) {
  const instant = options.instant ?? false;

  return new SceneQueryRunner({
    datasource: prometheusDatasource(),
    queries: [
      {
        refId,
        expr,
        format: options.format ?? 'time_series',
        instant,
        legendFormat: options.legendFormat,
        range: !instant,
        timeRangeCompare: options.timeRangeCompare,
      },
    ],
    maxDataPoints: 800,
    minInterval: '30s',
  });
}

export function promTableRunner(queries: PromTableQuery[]) {
  return new SceneQueryRunner({
    datasource: prometheusDatasource(),
    queries: queries.map((query) => ({
      refId: query.refId,
      expr: query.expr,
      format: 'table',
      instant: true,
      legendFormat: query.legendFormat,
      range: false,
      timeRangeCompare: false,
    })),
    maxDataPoints: 800,
    minInterval: '30s',
  });
}

export function promTableQueryRunner(queries: PromTableQuery[]) {
  return promTableRunner(queries);
}

export function prometheusTableData(expr: string) {
  return new SceneDataTransformer({
    $data: promRunner(expr, 'A', { format: 'table', instant: true, legendFormat: '', timeRangeCompare: false }),
    transformations: [
      {
        id: 'organize',
        options: {
          excludeByName: {
            Time: true,
          },
          renameByName: {
            Value: 'value',
          },
        },
      },
    ],
  });
}

export function joinedPrometheusTableData(
  queries: PromTableQuery[],
  renameByName: Record<string, string>,
  excludeByName: Record<string, boolean> = {}
) {
  return new SceneDataTransformer({
    $data: promTableRunner(queries),
    transformations: [
      {
        id: 'joinByField',
        options: {
          byField: 'cluster',
          mode: 'outerTabular',
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            Time: true,
            ...excludeByName,
          },
          renameByName,
        },
      },
    ],
  });
}

function absoluteThresholds(steps: ThresholdStep[]) {
  return {
    mode: ThresholdsMode.Absolute,
    steps,
  };
}

export function percentThresholds() {
  return absoluteThresholds([
    { color: 'green', value: -Infinity },
    { color: 'yellow', value: 0.8 },
    { color: 'red', value: 0.9 },
  ]);
}

function overRequestThresholds() {
  return absoluteThresholds([
    { color: 'green', value: -Infinity },
    { color: 'yellow', value: 0.8 },
    { color: 'red', value: 1 },
  ]);
}

export function legendFromPromQuery(expr: string) {
  const normalizedExpr = expr.replace(/\$\{[^}]+\}/g, '$var');
  const byMatches = Array.from(normalizedExpr.matchAll(/\bby\s*\(([^)]+)\)/g));
  const labels = byMatches
    .map((match) =>
      match[1]
        .split(',')
        .map((label) => label.trim())
        .filter((label) => label && label !== 'le')
    )
    .filter((matchLabels) => matchLabels.length > 0);
  const shortestLabels = labels.sort((a, b) => a.length - b.length)[0];

  if (shortestLabels) {
    return shortestLabels.map((label) => `{{${label}}}`).join(' / ');
  }

  const selectorLabels = Array.from(normalizedExpr.matchAll(/\{([^}]+)\}/g)).flatMap((match) =>
    match[1]
      .split(',')
      .map((matcher) => matcher.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:!?=|!?=~)/)?.[1])
      .filter((label): label is string => Boolean(label))
  );
  const legendLabels = [
    'cluster',
    'namespace',
    'workload',
    'workload_type',
    'node',
    'pod',
    'container',
    'mountpoint',
    'device',
  ];
  const labelsInOrder = legendLabels.filter((label) => selectorLabels.includes(label));

  return labelsInOrder.map((label) => `{{${label}}}`).join(' / ');
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

export function percentStatPanel(title: string, expr: string) {
  return PanelBuilders.stat()
    .setTitle(title)
    .setData(promRunner(expr, 'A', { instant: true, timeRangeCompare: false }))
    .setNoValue('-')
    .setUnit('percentunit')
    .setDecimals(1)
    .setMin(0)
    .setMax(1)
    .setThresholds(percentThresholds())
    .build();
}

export function tablePanel(title: string, expr: string) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(prometheusTableData(expr))
    .setNoValue('-')
    .setFilterable(true)
    .build();
}

export function topTablePanel(title: string, expr: string, unit?: string, links: DataLink[] = []) {
  let builder = PanelBuilders.table()
    .setTitle(title)
    .setData(prometheusTableData(expr))
    .setNoValue('-')
    .setDecimals(unit === 'percentunit' ? 2 : 1)
    .setFilterable(true);

  if (unit) {
    builder = builder.setUnit(unit);
  }

  if (links.length > 0) {
    builder = builder.setLinks(links);
  }

  return builder.build();
}

export function nodeGraphPanel(title: string, nodesExpr: string, edgesExpr: string) {
  return PanelBuilders.nodegraph()
    .setTitle(title)
    .setData(
      promTableQueryRunner([
        { refId: 'nodes', expr: nodesExpr, legendFormat: '' },
        { refId: 'edges', expr: edgesExpr, legendFormat: '' },
      ])
    )
    .build();
}

export function linkedTablePanel(title: string, expr: string, links: DataLink[]) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(prometheusTableData(expr))
    .setNoValue('-')
    .setFilterable(true)
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
    .setData(promRunner(expr, 'A', { legendFormat: legendFromPromQuery(expr) }))
    .setNoValue('-')
    .setColor({ mode: FieldColorModeId.PaletteClassic });

  if (unit) {
    builder = builder.setUnit(unit);
  }

  return builder.build();
}

export function ratioTimeseriesPanel(title: string, expr: string) {
  return PanelBuilders.timeseries()
    .setTitle(title)
    .setData(promRunner(expr, 'A', { legendFormat: legendFromPromQuery(expr) }))
    .setNoValue('-')
    .setUnit('percentunit')
    .setDecimals(2)
    .setMin(0)
    .setMax(1)
    .setThresholds(percentThresholds())
    .setColor({ mode: FieldColorModeId.PaletteClassic })
    .build();
}

export function overRequestRatioTimeseriesPanel(title: string, expr: string) {
  return PanelBuilders.timeseries()
    .setTitle(title)
    .setData(promRunner(expr, 'A', { legendFormat: legendFromPromQuery(expr) }))
    .setNoValue('-')
    .setUnit('percentunit')
    .setDecimals(2)
    .setMin(0)
    .setThresholds(overRequestThresholds())
    .setColor({ mode: FieldColorModeId.PaletteClassic })
    .build();
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

export function criticalStatPanel(title: string, expr: string) {
  return PanelBuilders.stat()
    .setTitle(title)
    .setData(promRunner(expr, 'A', { instant: true, timeRangeCompare: false }))
    .setNoValue('0')
    .setThresholds(
      absoluteThresholds([
        { color: 'green', value: -Infinity },
        { color: 'yellow', value: 1 },
        { color: 'red', value: 5 },
      ])
    )
    .build();
}

export function textPanel(title: string, content: string) {
  return PanelBuilders.text()
    .setTitle(title)
    .setOption('content', content)
    .setOption('mode', 'markdown' as never)
    .build();
}

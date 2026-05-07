import React from 'react';
import { AppPluginMeta, PluginConfigPageProps } from '@grafana/data';
import { Alert, Stack } from '@grafana/ui';

type JsonData = {};

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<JsonData>> {}

const AppConfig = (_props: AppConfigProps) => {
  return (
    <Stack direction="column" gap={2}>
      <Alert title="Configuration is datasource-driven" severity="info">
        This app reads metrics from Prometheus or Thanos, logs/events from Elasticsearch, and optional infrastructure
        metadata from rqlite. Configure datasource defaults in Grafana provisioning or pass them through URL variables.
      </Alert>
      <pre>
        var-datasource=prometheus&amp;var-elasticsearch=elasticsearch&amp;var-infraDatasource=infra-metadata
      </pre>
    </Stack>
  );
};

export default AppConfig;

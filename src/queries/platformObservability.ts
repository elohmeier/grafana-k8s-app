import { EntityScope, scopedMatchers } from './prometheus';

export function prometheusRemoteWriteFailures(scope: EntityScope = {}) {
  return `
sum by (cluster, remote_name, url) (
  rate(prometheus_remote_storage_failed_samples_total{${scopedMatchers(scope)}}[$__rate_interval])
)
`;
}

export function prometheusRemoteWritePending(scope: EntityScope = {}) {
  return `
sum by (cluster, remote_name, url) (
  prometheus_remote_storage_samples_pending{${scopedMatchers(scope)}}
)
`;
}

export function prometheusScrapeFailures(scope: EntityScope = {}) {
  return `
sum by (cluster, job) (
  up{${scopedMatchers(scope)}} == 0
)
`;
}

export function alertmanagerNotificationsFailed(scope: EntityScope = {}) {
  return `
sum by (cluster, integration) (
  rate(alertmanager_notifications_failed_total{${scopedMatchers(scope)}}[$__rate_interval])
)
`;
}

export function vectorComponentErrors(scope: EntityScope = {}) {
  return `
sum by (cluster, component_id, component_type) (
  rate(vector_component_errors_total{${scopedMatchers(scope)}}[$__rate_interval])
)
`;
}

export function alloyComponentErrors(scope: EntityScope = {}) {
  return `
sum by (cluster, component_id) (
  rate(alloy_component_controller_evaluation_slow_seconds_count{${scopedMatchers(scope)}}[$__rate_interval])
)
`;
}

import { EntityScope, scopedMatchers } from './prometheus';

export function apiServerRequestRate(scope: EntityScope = {}) {
  return `
sum by (cluster, code, verb) (
  rate(apiserver_request_total{${scopedMatchers(scope)}, code!=""}[$__rate_interval])
  or
  rate(apiserver_request_count{${scopedMatchers(scope)}, code!=""}[$__rate_interval])
)
`;
}

export function apiServerLatencyP95(scope: EntityScope = {}) {
  return `
histogram_quantile(
  0.95,
  sum by (cluster, verb, resource, le) (
    rate(apiserver_request_duration_seconds_bucket{${scopedMatchers(scope)}}[$__rate_interval])
  )
)
`;
}

export function etcdLeaderChanges(scope: EntityScope = {}) {
  return `
sum by (cluster) (
  rate(etcd_server_leader_changes_seen_total{${scopedMatchers(scope)}}[$__rate_interval])
)
`;
}

export function etcdDbSize(scope: EntityScope = {}) {
  return `
max by (cluster, instance) (
  etcd_mvcc_db_total_size_in_bytes{${scopedMatchers(scope)}}
)
`;
}

export function etcdWalFsyncP99(scope: EntityScope = {}) {
  return `
histogram_quantile(
  0.99,
  sum by (cluster, instance, le) (
    rate(etcd_disk_wal_fsync_duration_seconds_bucket{${scopedMatchers(scope)}}[$__rate_interval])
  )
)
`;
}

export function etcdBackendCommitP99(scope: EntityScope = {}) {
  return `
histogram_quantile(
  0.99,
  sum by (cluster, instance, le) (
    rate(etcd_disk_backend_commit_duration_seconds_bucket{${scopedMatchers(scope)}}[$__rate_interval])
  )
)
`;
}
